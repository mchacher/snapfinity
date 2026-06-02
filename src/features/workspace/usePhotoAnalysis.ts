import { useCallback, useState } from 'react';
import type { PhotoAnalysis } from '../../vision/analyze';

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
