import { useCallback, useEffect, useRef, useState } from 'react';
import type { DerivedMask } from '../../vision/analyze';
import { paintDisc } from '../../vision/mask-edit';

export interface MaskEdit {
  /** Auto mask with the brush edits composited in (or the base mask when there are no edits). */
  editedMask: DerivedMask | null;
  hasEdits: boolean;
  /** Paint a disc (mask-space coords + radius) — value from mask-edit (ADD / ERASE). */
  paint: (maskX: number, maskY: number, maskRadius: number, value: number) => void;
  reset: () => void;
}

/**
 * Owns the brush edit layer (a Uint8Array at the base mask's resolution) and produces the
 * edited mask. Edits live *over* the auto mask, so they persist when the auto mask re-runs
 * (flatten/threshold/exposure). The contour re-derive (`applyEdits`, cv) is throttled so
 * painting stays smooth; with no edits the base mask passes through untouched (no cv work).
 */
export function useMaskEdit(base: DerivedMask | null, fullW: number, fullH: number): MaskEdit {
  const layerRef = useRef<Uint8Array | null>(null);
  const lastRun = useRef(0);
  const [hasEdits, setHasEdits] = useState(false);
  const [version, setVersion] = useState(0);
  const [edited, setEdited] = useState<DerivedMask | null>(null);

  const w = base?.mask.width ?? 0;
  const h = base?.mask.height ?? 0;

  const reset = useCallback(() => {
    layerRef.current = null;
    setHasEdits(false);
    setVersion((v) => v + 1);
  }, []);

  const paint = useCallback(
    (mx: number, my: number, mr: number, value: number) => {
      if (!w || !h) return;
      if (!layerRef.current || layerRef.current.length !== w * h) layerRef.current = new Uint8Array(w * h);
      paintDisc(layerRef.current, w, h, mx, my, mr, value);
      setHasEdits(true);
      setVersion((v) => v + 1);
    },
    [w, h],
  );

  useEffect(() => {
    if (!base) {
      setEdited(null);
      return;
    }
    const layer = layerRef.current;
    if (!hasEdits || !layer || layer.length !== base.mask.width * base.mask.height) {
      setEdited(base);
      return;
    }
    let cancelled = false;
    const run = () =>
      void (async () => {
        lastRun.current = Date.now();
        const { applyEdits } = await import('../../vision/analyze');
        if (!cancelled) setEdited(applyEdits(base, layer, fullW, fullH));
      })();
    const elapsed = Date.now() - lastRun.current;
    if (elapsed >= 100) {
      run();
      return () => {
        cancelled = true;
      };
    }
    const id = setTimeout(run, 100 - elapsed);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [base, hasEdits, version, fullW, fullH]);

  return { editedMask: edited, hasEdits, paint, reset };
}
