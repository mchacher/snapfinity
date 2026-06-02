import { useEffect, useRef, useState } from 'react';
import type { BufferGeometry } from 'three';
import type { Shape3D } from 'replicad';
import { initOcForBrowser } from '../../cad/oc-browser';
import { makeBin } from '../../cad/bin';
import { makeBinWithPocket } from '../../cad/pocket';
import { shapeToGeometry } from '../../cad/mesh';
import type { Point2D } from '../../core/offset';
import type { Params } from './Workspace';

export type BinStatus = 'loading' | 'ready' | 'error';

export interface BinResult {
  geometry: BufferGeometry | null;
  shape: Shape3D | null;
  status: BinStatus;
}

/**
 * Build the Gridfinity bin (debounced), ready for preview + export. With a footprint + the
 * preview enabled it cuts the object-shaped pocket (`makeBinWithPocket`, depth = tool
 * thickness); otherwise the plain bin. The build is **gated on `enabled`** (the Preview tab):
 * replicad runs on the main thread, so we never re-cut the pocket while the user is painting on
 * the Outline tab. A signature guard skips rebuilding when nothing changed (e.g. tab toggles).
 */
export function useBin(params: Params, footprintMm: Point2D[] | null, enabled: boolean): BinResult {
  const [result, setResult] = useState<BinResult>({ geometry: null, shape: null, status: 'loading' });
  const built = useRef<{ sig: string; fp: Point2D[] | null } | null>(null);

  const hasPocket = !!footprintMm && footprintMm.length >= 3;
  const sig = `${params.cols}|${params.rows}|${params.heightUnits}|${params.pitchMm}|${params.includeLip}|${params.thicknessMm}`;

  useEffect(() => {
    if (!enabled) return;
    if (built.current && built.current.sig === sig && built.current.fp === footprintMm) return;

    let cancelled = false;
    setResult((r) => ({ ...r, status: 'loading' }));
    const timer = setTimeout(() => {
      void (async () => {
        try {
          await initOcForBrowser();
          const binParams = {
            cols: params.cols,
            rows: params.rows,
            heightUnits: params.heightUnits,
            pitchMm: params.pitchMm,
            includeLip: params.includeLip,
          };
          const shape = hasPocket
            ? makeBinWithPocket(binParams, footprintMm as Point2D[], { depthMm: params.thicknessMm })
            : makeBin(binParams);
          const geometry = shapeToGeometry(shape);
          if (!cancelled) {
            built.current = { sig, fp: footprintMm };
            setResult({ geometry, shape, status: 'ready' });
          }
        } catch {
          if (!cancelled) setResult((r) => ({ ...r, status: 'error' }));
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, sig, footprintMm, hasPocket, params.cols, params.rows, params.heightUnits, params.pitchMm, params.includeLip, params.thicknessMm]);

  return result;
}
