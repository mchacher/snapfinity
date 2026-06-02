import { useEffect, useRef, useState } from 'react';
import type { DerivedMask, PhotoAnalysis } from '../../vision/analyze';

export type AnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'error';

export interface PhotoAnalysisState {
  status: AnalysisStatus;
  result: PhotoAnalysis | null;
  setFile: (file: File | null) => void;
}

/**
 * Run the in-browser vision pipeline on the current photo + brightness/contrast. The heavy
 * WASM (opencv.js + onnxruntime-web + u2netp) is dynamically imported on the first photo, so
 * it never lands in the entry chunk / blocks first paint. A new photo analyses immediately;
 * brightness/contrast changes re-run the inference **debounced** (they alter the model input).
 */
export function usePhotoAnalysis({
  flatten,
  brightness,
  contrast,
}: {
  flatten: boolean;
  brightness: number;
  contrast: number;
}): PhotoAnalysisState {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<PhotoAnalysis | null>(null);
  const lastFile = useRef<File | null>(null);

  useEffect(() => {
    if (!file) {
      lastFile.current = null;
      setStatus('idle');
      setResult(null);
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
          const r = await analyzePhoto(file, { flatten, brightness, contrast });
          if (!cancelled) {
            setResult(r);
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
  }, [file, flatten, brightness, contrast]);

  return { status, result, setFile };
}

/**
 * Re-derive the isolated mask + contour from the analysis at the chosen detection threshold.
 * Debounced so dragging the threshold slider stays smooth; never re-runs the u2netp inference
 * (only the cheap re-threshold + cv post-processing). The heavy module is already loaded by
 * the time there's a result, so the dynamic import resolves instantly.
 */
export function useDerivedMask(result: PhotoAnalysis | null, threshold: number): DerivedMask | null {
  const [derived, setDerived] = useState<DerivedMask | null>(null);
  const lastResult = useRef<PhotoAnalysis | null>(null);

  useEffect(() => {
    if (!result) {
      lastResult.current = null;
      setDerived(null);
      return;
    }
    // A fresh photo derives immediately (no perceptible lag on open); only threshold tweaks
    // are debounced so dragging the slider coalesces into one re-derive.
    const immediate = lastResult.current !== result;
    lastResult.current = result;
    let cancelled = false;
    const run = () =>
      void (async () => {
        const { deriveMask } = await import('../../vision/analyze');
        if (!cancelled) setDerived(deriveMask(result, threshold));
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
  }, [result, threshold]);

  return derived;
}
