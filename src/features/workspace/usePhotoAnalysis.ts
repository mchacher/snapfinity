import { useEffect, useRef, useState } from 'react';
// IMPORTANT: only TYPE-import from `analyze`/`edges` here. A value import pulls in their static
// deps (opencv + onnxruntime-web) eagerly, which hangs vitest's module scan and re-bloats the
// entry chunk. framingKey/FramedPhoto live in the pure `photo-transform`.
import type { DerivedMask, PhotoAnalysis } from '../../vision/analyze';
import type { SegmentMode } from '../../vision/segment-mode';
import { framingKey, type CropRect, type FramedPhoto } from '../../vision/photo-transform';

export type AnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'error';

export interface PhotoAnalysisState {
  status: AnalysisStatus;
  result: PhotoAnalysis | null;
  /** The current (rotated/cropped) photo to display — updates immediately, before the détourage. */
  framed: FramedPhoto | null;
  /** Cheap identity of `framed` (the framing) — pass this (not the heavy ImageData) as a render
   * trigger so the megabyte-sized buffer never goes through React's (dev-mode) reconciler. */
  framedKey: string | null;
  /** True while `result` reflects an older framing than what's shown (détourage catching up). */
  framingPending: boolean;
  setFile: (file: File | null) => void;
}

/**
 * Run the in-browser vision pipeline on the current photo + brightness/contrast. It's split in
 * two so a crop/straighten feels instant:
 *  - **fast** — the rotated/cropped photo (`framed`) is produced from a cheap canvas transform and
 *    shown right away (`framePhoto`, no opencv / inference);
 *  - **slow** — the détourage (token + u2netp) runs after, debounced for adjustments, and updates
 *    `result`. While it catches up to a new framing, `framingPending` is true so the (stale,
 *    differently-framed) contour isn't drawn over the freshly cropped photo.
 *
 * The heavy WASM (opencv.js + onnxruntime-web + u2netp) is dynamically imported, so it never lands
 * in the entry chunk / blocks first paint.
 */
export function usePhotoAnalysis({
  flatten,
  brightness,
  contrast,
  straightenDeg,
  cropRect,
}: {
  flatten: number;
  brightness: number;
  contrast: number;
  straightenDeg: number;
  cropRect: CropRect | null;
}): PhotoAnalysisState {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<PhotoAnalysis | null>(null);
  const [framed, setFramed] = useState<FramedPhoto | null>(null);
  const [framedKey, setFramedKey] = useState<string | null>(null);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const lastFile = useRef<File | null>(null);

  const key = framingKey(straightenDeg, cropRect);

  // FAST: show the rotated/cropped photo immediately (transform only — no inference). Re-runs only
  // when the framing changes, so brightness/contrast don't churn it.
  useEffect(() => {
    if (!file) {
      setFramed(null);
      setFramedKey(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { framePhoto } = await import('../../vision/analyze');
        const f = await framePhoto(file, { straightenDeg, cropRect });
        if (!cancelled) {
          setFramed(f);
          setFramedKey(key);
        }
      } catch (err) {
        console.error('photo framing failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, straightenDeg, cropRect, key]);

  // SLOW: the full détourage (token + u2netp). Immediate on a new photo, debounced for adjustments.
  useEffect(() => {
    if (!file) {
      lastFile.current = null;
      setStatus('idle');
      setResult(null);
      setResultKey(null);
      return;
    }
    const freshFile = lastFile.current !== file;
    lastFile.current = file;
    let cancelled = false;
    setStatus('analyzing');
    const run = () =>
      void (async () => {
        try {
          const { analyzePhoto } = await import('../../vision/analyze');
          const r = await analyzePhoto(file, { flatten, brightness, contrast, straightenDeg, cropRect });
          if (!cancelled) {
            setResult(r);
            setResultKey(key);
            setStatus('ready');
          }
        } catch (err) {
          console.error('photo analysis failed', err);
          if (!cancelled) setStatus('error');
        }
      })();
    if (freshFile) {
      run();
      return () => {
        cancelled = true;
      };
    }
    const timer = setTimeout(run, 450); // adjustment change → re-infer, debounced
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [file, flatten, brightness, contrast, straightenDeg, cropRect, key]);

  // The détourage is stale (don't draw it) while the result's framing trails what's displayed.
  const framingPending = framed != null && framedKey !== resultKey;
  return { status, result, framed, framedKey, framingPending, setFile };
}

/**
 * Re-derive the isolated mask + contour from the analysis at the chosen detection threshold.
 * Debounced so dragging the threshold slider stays smooth; never re-runs the u2netp inference
 * (only the cheap re-threshold + cv post-processing). The heavy module is already loaded by
 * the time there's a result, so the dynamic import resolves instantly.
 */
export function useDerivedMask(
  result: PhotoAnalysis | null,
  threshold: number,
  mode: SegmentMode = 'auto',
): DerivedMask | null {
  const [derived, setDerived] = useState<DerivedMask | null>(null);
  const lastResult = useRef<PhotoAnalysis | null>(null);

  useEffect(() => {
    if (!result) {
      lastResult.current = null;
      setDerived(null);
      return;
    }
    // A fresh photo derives immediately (no perceptible lag on open); only threshold/mode tweaks
    // are debounced so dragging the slider / flipping the mode coalesces into one re-derive.
    const immediate = lastResult.current !== result;
    lastResult.current = result;
    let cancelled = false;
    const run = () =>
      void (async () => {
        const { deriveMask } = await import('../../vision/analyze');
        if (!cancelled) setDerived(deriveMask(result, threshold, mode));
      })();
    if (immediate) {
      run();
      return () => {
        cancelled = true;
      };
    }
    const timer = setTimeout(run, 80);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [result, threshold, mode]);

  return derived;
}
