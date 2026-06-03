# Plan — 025 undo / redo

## Steps

1. [ ] `src/features/workspace/history.ts` (pure) — `init`, `record` (capped), `undo`, `redo`,
   `canUndo`, `canRedo`. + `history.test.ts`.
2. [ ] `useMaskEdit` — expose `version`, `snapshot()`, `restore(layer)`.
3. [ ] `useUndoRedo.ts` — `History<Snapshot>` + idle-commit coalescing + `applying` guard + apply
   (`setParams` + `restore`); reset on a new photo.
4. [ ] `Workspace` — wire it; window `keydown` for ⌘Z / ⌘⇧Z (ignore inputs).
5. [ ] `Header` — `↶` / `↷` buttons (disabled from `canUndo` / `canRedo`); i18n `undo` / `redo`.
6. [ ] `docs/specs-index.md` row 025.

## Test plan

| Module | Scenario | Type |
| ------ | -------- | ---- |
| `history.ts` | `record` pushes present→past, clears future; `undo`/`redo` move across; `canUndo`/`canRedo` at the ends | unit |
| | depth cap drops the oldest | unit |
| | `record` after an `undo` clears the redo branch | unit |
| `useUndoRedo` + UI | drag/stroke = one step; ⌘Z/⌘⇧Z + buttons; brush + params both revert; new photo clears | **manual** |

**Why manual for the hook.** The coalescing is timing-based and the brush/opencv state needs the
browser — not assertable under vitest. The **pure stack is unit-tested**; the wiring is a manual
check (undo a crop, a 90° turn, a slider drag, a brush stroke; redo them).

## Validation (Gate 4)

```
npm run build / lint / typecheck / test   # clean
```

Manual: change a few params + paint, then ⌘Z several times (each step reverts one action incl.
the brush), ⌘⇧Z to redo; load a new photo → history cleared.
