import { useEffect, useRef, useState } from 'react';
import { canRedo, canUndo, initHistory, record, redo, undo, type History } from './history';
import type { Params } from './Workspace';

/** One undoable state: the params + a copy of the brush edit layer. */
interface Snapshot {
  params: Params;
  brush: Uint8Array | null;
}

interface Args {
  params: Params;
  setParams: (params: Params) => void;
  /** Brush change signal (bumps on paint/reset/restore). */
  version: number;
  snapshot: () => Uint8Array | null;
  restore: (layer: Uint8Array | null) => void;
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

/**
 * Multi-step undo/redo over `{ params, brush }`. Changes are committed to history **on idle**
 * (so a slider drag or a brush stroke is one step); applying an undo/redo is flagged so it
 * doesn't record a new entry. The pure stack lives in `history.ts`.
 */
export function useUndoRedo({ params, setParams, version, snapshot, restore, resetKey }: Args): UndoRedo {
  const hist = useRef<History<Snapshot>>(initHistory({ params, brush: snapshot() }));
  // identity of the present snapshot, to skip no-op commits (mount, post-apply).
  const committed = useRef<{ params: Params; version: number }>({ params, version });
  const applying = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  // commit-on-idle: coalesce a burst of changes (slider drag / brush stroke) into one record.
  useEffect(() => {
    if (applying.current) {
      applying.current = false;
      committed.current = { params, version };
      return;
    }
    if (params === committed.current.params && version === committed.current.version) return; // no real change
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      hist.current = record(hist.current, { params, brush: snapshot() });
      committed.current = { params, version };
      timer.current = null;
      rerender();
    }, IDLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [params, version, snapshot]);

  // new photo → fresh history
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    hist.current = initHistory({ params, brush: snapshot() });
    committed.current = { params, version };
    rerender();
  }, [resetKey]);

  const flushPending = () => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    hist.current = record(hist.current, { params, brush: snapshot() });
    committed.current = { params, version };
  };

  const apply = (snap: Snapshot) => {
    applying.current = true;
    setParams(snap.params);
    restore(snap.brush);
    rerender();
  };

  const doUndo = () => {
    flushPending();
    if (!canUndo(hist.current)) return;
    hist.current = undo(hist.current);
    apply(hist.current.present);
  };
  const doRedo = () => {
    flushPending();
    if (!canRedo(hist.current)) return;
    hist.current = redo(hist.current);
    apply(hist.current.present);
  };

  return { undo: doUndo, redo: doRedo, canUndo: canUndo(hist.current), canRedo: canRedo(hist.current) };
}
