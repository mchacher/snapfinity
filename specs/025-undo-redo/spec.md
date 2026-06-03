# Spec 025 — undo / redo (parameters + brush)

## Overview

Add **multi-step undo / redo** over the whole editing state: every left-panel parameter
(**framing — crop / rotate / straighten —, size, pitch, height, clearance, smoothing, notches,
opacity, threshold, brightness/contrast…**) **and the brush mask edits**. Keyboard ⌘Z / ⌘⇧Z
(Ctrl on Windows) + two buttons in the header.

## Goals

- One unified undo stack: undo reverts the last action whatever it was (a slider, a crop, a
  90° turn, a brush stroke).
- Multiple levels of undo **and** redo.
- Continuous interactions coalesce into **one** step (a slider drag / a brush stroke = one undo,
  not one-per-pixel).
- History resets on a new photo (new context).

## Non-goals

- Undo of the photo upload itself, or of an export.
- A visible history panel / named states (just linear undo/redo).
- Persisting history across reloads.

## Requirements

### Scope of a snapshot
A snapshot captures `{ params, brushLayer }`:
- `params` — the full `Params` object.
- `brushLayer` — a copy of the brush edit layer (`Uint8Array`, base-mask resolution) or `null`.

### Coalescing
- Changes are committed to history **on idle** (~400 ms after the last change), so a slider drag
  or a brush stroke produces a single history entry.
- The history depth is **capped** (e.g. 40) so brush snapshots (≤ ~1 MB each) can't grow memory
  without bound; the oldest entries drop.

### Undo / redo
- `Undo` restores the previous snapshot (params **and** brush layer); `Redo` re-applies.
- Applying an undo/redo must **not** create new history entries (programmatic restore is ignored).
- A pending (un-committed) change is flushed before an undo so a mid-drag undo behaves.

### UI
- `⌘Z` / `Ctrl+Z` = undo, `⌘⇧Z` / `Ctrl+Shift+Z` (or `Ctrl+Y`) = redo — ignored while typing in a
  field. Two header buttons (↶ / ↷) with disabled states from `canUndo` / `canRedo`.

## Acceptance criteria

- [ ] Undo/redo step through param changes (incl. crop / rotate / straighten) and brush strokes.
- [ ] A slider drag / a brush stroke is a single undo step.
- [ ] Keyboard shortcuts + header buttons work; buttons disable at the ends of the stack.
- [ ] New photo clears the history.
- [ ] The pure history stack (push / undo / redo / cap) is **unit-tested**.
- [ ] `build` / `lint` / `typecheck` clean.

## Scope (files)

**In:** a pure `history.ts` (stack ops) + test; a `useHistory` hook (coalesce + apply); expose
`snapshot()` / `restore()` from `useMaskEdit`; wire params + brush through it in `Workspace`;
header undo/redo buttons; i18n.

**Out:** history panel, persistence, export/upload undo.

## Edge cases

- **Mid-drag undo** → flush the pending commit first.
- **New photo** → reset history + brush.
- **No brush edits** → `brushLayer` is `null` (cheap snapshots).
- **Typing in a NumberField** → shortcuts ignored (don't hijack ⌘Z in inputs).
