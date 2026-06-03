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
 * Multi-step undo/redo over `{ params, brush }`. Changes are committed **on idle** (so a slider
 * drag or a brush stroke is one step). At commit time a change is either **recorded** (a real
 * user action) or **folded** into the present (auto-derived size). Applying an undo/redo is
 * flagged so it doesn't record. The pure stack lives in `history.ts`.
 */
export function useUndoRedo({ params, setParams, version, snapshot, restore, resetKey }: Args): UndoRedo {
  const hist = useRef<History<Snapshot>>(initHistory({ params, brush: snapshot() }));
  const committed = useRef<{ params: Params; version: number }>({ params, version });
  const latest = useRef<{ params: Params; version: number }>({ params, version });
  const applying = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  latest.current = { params, version };

  const commit = () => {
    timer.current = null;
    const { params: p, version: v } = latest.current;
    if (p === committed.current.params && v === committed.current.version) return;
    const meaningful = v !== committed.current.version || meaningfulParamChange(committed.current.params, p);
    if (meaningful) {
      hist.current = record(hist.current, { params: p, brush: snapshot() });
      rerender();
    } else {
      // auto-derived size only → keep the present in sync without a new undo step
      hist.current = { ...hist.current, present: { ...hist.current.present, params: p } };
    }
    committed.current = { params: p, version: v };
  };

  // schedule a coalesced commit whenever the state changes (user-driven, not an undo apply)
  useEffect(() => {
    if (applying.current) {
      applying.current = false;
      committed.current = { params, version };
      return;
    }
    if (params === committed.current.params && version === committed.current.version) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(commit, IDLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [params, version, snapshot]);

  // new photo → fresh history
  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    hist.current = initHistory({ params, brush: snapshot() });
    committed.current = { params, version };
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
