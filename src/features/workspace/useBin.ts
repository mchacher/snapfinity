import { useCallback, useEffect, useRef, useState } from 'react';
import type { BufferGeometry } from 'three';
import { arraysToGeometry } from '../../cad/mesh';
import { buildBin, exportBin as exportBinViaWorker } from '../../cad/cad-client';
import type { ExportFormat } from '../../cad/cad-messages';
import type { Point2D } from '../../core/offset';
import type { Params } from './Workspace';

export type BinStatus = 'loading' | 'ready' | 'error';

export interface BinResult {
  geometry: BufferGeometry | null;
  status: BinStatus;
  /** Export the worker's current shape; resolves to `null` on failure. */
  exportBin: (format: ExportFormat) => Promise<Blob | null>;
}

/**
 * Build the Gridfinity bin (debounced) in the **CAD worker**, ready for preview + export. With
 * a footprint + the preview enabled it cuts the object-shaped pocket (depth = tool thickness);
 * otherwise the plain bin. The worker keeps the shape and returns a transferable mesh, so the
 * main thread never blocks — the Preview tab stays interactive during a rebuild.
 *
 * The build is **gated on `enabled`** (the Preview tab) and debounced; a signature guard skips
 * rebuilding when nothing changed (e.g. tab toggles). Stale builds are dropped via `cancelled`.
 */
export function useBin(params: Params, footprintMm: Point2D[] | null, enabled: boolean): BinResult {
  const [state, setState] = useState<{ geometry: BufferGeometry | null; status: BinStatus }>({
    geometry: null,
    status: 'loading',
  });
  const built = useRef<{ sig: string; fp: Point2D[] | null } | null>(null);

  const hasPocket = !!footprintMm && footprintMm.length >= 3;
  const sig = `${params.cols}|${params.rows}|${params.heightUnits}|${params.pitchMm}|${params.includeLip}|${params.thicknessMm}`;

  useEffect(() => {
    if (!enabled) return;
    if (built.current && built.current.sig === sig && built.current.fp === footprintMm) return;

    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading' }));
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const binParams = {
            cols: params.cols,
            rows: params.rows,
            heightUnits: params.heightUnits,
            pitchMm: params.pitchMm,
            includeLip: params.includeLip,
          };
          const mesh = await buildBin(binParams, hasPocket ? footprintMm : null, params.thicknessMm);
          if (!cancelled) {
            built.current = { sig, fp: footprintMm };
            setState({ geometry: arraysToGeometry(mesh), status: 'ready' });
          }
        } catch {
          if (!cancelled) setState((s) => ({ ...s, status: 'error' }));
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, sig, footprintMm, hasPocket, params.cols, params.rows, params.heightUnits, params.pitchMm, params.includeLip, params.thicknessMm]);

  const exportBin = useCallback(
    (format: ExportFormat): Promise<Blob | null> => exportBinViaWorker(format).catch(() => null),
    [],
  );

  return { geometry: state.geometry, status: state.status, exportBin };
}
