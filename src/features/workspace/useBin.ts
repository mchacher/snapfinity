import { useEffect, useState } from 'react';
import type { BufferGeometry } from 'three';
import type { Shape3D } from 'replicad';
import { initOcForBrowser } from '../../cad/oc-browser';
import { makeBin } from '../../cad/bin';
import { shapeToGeometry } from '../../cad/mesh';
import type { Params } from './Workspace';

export type BinStatus = 'loading' | 'ready' | 'error';

export interface BinResult {
  geometry: BufferGeometry | null;
  shape: Shape3D | null;
  status: BinStatus;
}

/** Build the Gridfinity bin from the controls (debounced), ready for preview + export. */
export function useBin(params: Params): BinResult {
  const [result, setResult] = useState<BinResult>({ geometry: null, shape: null, status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          await initOcForBrowser();
          const shape = makeBin({
            cols: params.cols,
            rows: params.rows,
            heightUnits: params.heightUnits,
            pitchMm: params.pitchMm,
            includeLip: params.includeLip,
          });
          const geometry = shapeToGeometry(shape);
          if (!cancelled) setResult({ geometry, shape, status: 'ready' });
        } catch {
          if (!cancelled) setResult((r) => ({ ...r, status: 'error' }));
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [params.cols, params.rows, params.heightUnits, params.pitchMm, params.includeLip]);

  return result;
}
