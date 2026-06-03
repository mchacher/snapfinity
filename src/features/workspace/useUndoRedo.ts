import { useEffect, useRef, useState } from 'react';
import { canRedo, canUndo, initHistory, record, redo, undo, type History } from './history';
import type { Params } from './Workspace';
import type { Point2D } from '../../core/offset';

/** One undoable state: the params + a copy of the brush edit layer + the hand-edited contour. */
interface Snapshot {
  params: Params;
  brush: Uint8Array | null;
  contour: Point2D[] | null;
}

interface Args {
  params: Params;
  setParams: (params: Params) => void;
  /** Brush change signal (bumps on paint/reset/restore). */
  version: number;
  snapshot: () => Uint8Array | null;
  restore: (layer: Uint8Array | null) => void;
  /** Hand-edited contour (spec 035) + its setter — tracked as its own undo step. */
  editedContour: Point2D[] | null;
  setEditedContour: (contour: Point2D[] | null) => void;
  /** Changes when a new photo is loaded → clear the history. */
  resetKey: unknown;
}

export interface UndoRedo {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const IDLE_MS = 400;

type Tracked = { params: Params; version: number; contour: Point2D[] | null };

/**
 * A change worth its own undo step. **Auto-derived `cols`/`rows`** (set by the auto-size effect
 * after a re-analysis) are NOT user actions — they'd otherwise flood the history (and a crop
 * could never be undone). They're folded into the present instead.
 */
function meaningfulParamChange(prev: Params, next: Params): boolean {
  for (const key of Object.keys(next) as (keyof Params)[]) {
    if (next[key] === prev[key]) continue;
    if ((key === 'cols' || key === 'rows') && !next.manualSize) continue; // auto-derived
    return true;
  }
  return false;
}

/**
 * Multi-step undo/redo over `{ params, brush, contour }`. Changes are committed **on idle** (so a
 * slider drag, a brush stroke or a contour-node drag is one step). At commit time a change is
 * either **recorded** (a real user action) or **folded** into the present (auto-derived size).
 * Applying an undo/redo is flagged so it doesn't record. The pure stack lives in `history.ts`.
 */
export function useUndoRedo({
  params,
  setParams,
  version,
  snapshot,
  restore,
  editedContour,
  setEditedContour,
  resetKey,
}: Args): UndoRedo {
  const hist = useRef<History<Snapshot>>(initHistory({ params, brush: snapshot(), contour: editedContour }));
  const committed = useRef<Tracked>({ params, version, contour: editedContour });
  const latest = useRef<Tracked>({ params, version, contour: editedContour });
  const applying = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  latest.current = { params, version, contour: editedContour };

  const commit = () => {
    timer.current = null;
    const { params: p, version: v, contour: c } = latest.current;
    const cur = committed.current;
    if (p === cur.params && v === cur.version && c === cur.contour) return;
    const meaningful = v !== cur.version || c !== cur.contour || meaningfulParamChange(cur.params, p);
    if (meaningful) {
      hist.current = record(hist.current, { params: p, brush: snapshot(), contour: c });
      rerender();
    } else {
      // auto-derived size only → keep the present in sync without a new undo step
      hist.current = { ...hist.current, present: { ...hist.current.present, params: p } };
    }
    committed.current = { params: p, version: v, contour: c };
  };

  // schedule a coalesced commit whenever the state changes (user-driven, not an undo apply)
  useEffect(() => {
    if (applying.current) {
      applying.current = false;
      committed.current = { params, version, contour: editedContour };
      return;
    }
    const cur = committed.current;
    if (params === cur.params && version === cur.version && editedContour === cur.contour) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(commit, IDLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [params, version, snapshot, editedContour]);

  // new photo → fresh history
  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    hist.current = initHistory({ params, brush: snapshot(), contour: editedContour });
    committed.current = { params, version, contour: editedContour };
    rerender();
  }, [resetKey]);

  const flush = () => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    commit();
  };
  const apply = (snap: Snapshot) => {
    applying.current = true;
    setParams(snap.params);
    restore(snap.brush);
    setEditedContour(snap.contour);
    rerender();
  };
  const doUndo = () => {
    flush();
    if (!canUndo(hist.current)) return;
    hist.current = undo(hist.current);
    apply(hist.current.present);
  };
  const doRedo = () => {
    flush();
    if (!canRedo(hist.current)) return;
    hist.current = redo(hist.current);
    apply(hist.current.present);
  };

  return { undo: doUndo, redo: doRedo, canUndo: canUndo(hist.current), canRedo: canRedo(hist.current) };
}
