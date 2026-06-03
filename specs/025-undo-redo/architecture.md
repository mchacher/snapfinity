# Architecture — 025 undo / redo

## Pieces

### `src/features/workspace/history.ts` (pure — unit-tested)

A tiny generic undo stack, no React:

```
interface History<T> { past: T[]; present: T; future: T[] }
init(present): History<T>
record(h, next, limit): History   // present → past (capped to `limit`), present = next, future = []
undo(h): History                  // present → future, pop past → present
redo(h): History                  // present → past, pop future → present
canUndo(h) / canRedo(h): boolean
```

### Snapshot

`{ params: Params; brush: Uint8Array | null }` — the params plus a **copy** of the brush edit
layer (or null). The unit of undo.

### `useMaskEdit` additions

Expose the brush layer for snapshotting without leaking the ref:

```
version: number                 // already bumped on each paint/reset — the change signal
snapshot(): Uint8Array | null   // a copy of the current layer
restore(layer: Uint8Array | null): void   // set the layer (copy) + bump version
```

### `useUndoRedo` hook (coalesce + apply)

Owns `History<Snapshot>`. Inputs: `params` + `setParams`, the brush `version` + `snapshot` /
`restore`, and a `resetKey` (the photo) to clear history on a new photo.

- Watches `[params, version]`. On a **user** change it schedules a commit after ~400 ms idle;
  rapid changes (slider drag, brush stroke) coalesce into **one** `record`.
- `undo()` / `redo()` flush any pending commit, then `history.undo/redo` and **apply** the
  snapshot (`setParams` + `restore`) behind an `applying` ref so the apply doesn't re-record.
- Returns `{ undo, redo, canUndo, canRedo }`.

### Wiring (`Workspace`)

```
const maskEdit = useMaskEdit(...)
const { undo, redo, canUndo, canRedo } = useUndoRedo({ params, setParams, version: maskEdit.version,
  snapshot: maskEdit.snapshot, restore: maskEdit.restore, resetKey: photoFile })
```

`Header` gets `↶ / ↷` buttons (disabled from `canUndo/canRedo`). A window `keydown` handler maps
⌘Z / ⌘⇧Z (Ctrl on Windows), ignored when the target is an `<input>` / editable.

## Files

| File | Change |
| ---- | ------ |
| `history.ts` (+ test) | **new** — pure stack |
| `useUndoRedo.ts` | **new** — coalesce + apply hook |
| `useMaskEdit.ts` | expose `version` / `snapshot` / `restore` |
| `Workspace.tsx` | wire it; keyboard handler |
| `Header.tsx` | undo / redo buttons |
| `i18n/*` | `undo` / `redo` labels |

## Risks

- **Coalescing correctness** (drag/stroke = one step) — debounce + an `applying` guard; the
  stack itself is unit-tested, the timing is a manual check.
- **Memory** — brush snapshots ≤ ~1 MB; cap the stack depth (≈ 40) so it can't grow unbounded.
- **Brush layer is a ref** — `version` is the reactive signal; snapshot/restore copy the bytes.
