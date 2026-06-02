import { useCallback, useEffect, useState } from 'react';
import type { DerivedMask, PhotoAnalysis } from '../../vision/analyze';

export type AnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'error';

export interface PhotoAnalysisState {
  status: AnalysisStatus;
  result: PhotoAnalysis | null;
  analyze: (file: Blob, tokenOdMm: number) => void;
}

/**
 * Run the in-browser vision pipeline on an uploaded photo. The heavy WASM (opencv.js +
 * onnxruntime-web + u2netp) is dynamically imported on the first photo, so it never lands
 * in the entry chunk / blocks first paint.
 */
export function usePhotoAnalysis(): PhotoAnalysisState {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<PhotoAnalysis | null>(null);

  const analyze = useCallback((file: Blob, tokenOdMm: number) => {
    setStatus('analyzing');
    void (async () => {
      try {
        const { analyzePhoto } = await import('../../vision/analyze');
        setResult(await analyzePhoto(file, { tokenOdMm }));
        setStatus('ready');
      } catch (err) {
        console.error('photo analysis failed', err);
        setStatus('error');
      }
    })();
  }, []);

  return { status, result, analyze };
}

/**
 * Re-derive the isolated mask + contour from the analysis at the chosen detection threshold.
 * Debounced so dragging the threshold slider stays smooth; never re-runs the u2netp inference
 * (only the cheap re-threshold + cv post-processing). The heavy module is already loaded by
 * the time there's a result, so the dynamic import resolves instantly.
 */
export function useDerivedMask(result: PhotoAnalysis | null, threshold: number): DerivedMask | null {
  const [derived, setDerived] = useState<DerivedMask | null>(null);

  useEffect(() => {
    if (!result) {
      setDerived(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const { deriveMask } = await import('../../vision/analyze');
        if (!cancelled) setDerived(deriveMask(result, threshold));
      })();
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [result, threshold]);

  return derived;
}
