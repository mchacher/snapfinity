# Spec 037 — magnetic lasso (editable-détourage roadmap 3/3)

## Overview

Roadmap step 3/3 (after 035 editable contour, 036 GrabCut). A **magnetic lasso** à la Photoshop:
the user clicks on the object's edge and moves the cursor along it — the boundary **snaps to the
nearest strong edge** (live-wire / "Intelligent Scissors") — clicking drops anchors and closing the
loop yields a contour that seeds the **editable contour** (035) to refine by hand. The precise,
manual counterpart to GrabCut's rough box: best for crisp edges on a busy background.

## Goals

- Trace an object boundary that **hugs the edges** with a few clicks instead of dragging every node.
- Close the loop → a contour → straight into the **node editor** (035).
- 100 % in-browser, no opencv (the algorithm is implemented in TS), no test/CI hang.

## Non-goals

- Cursor-snap-to-edge magnet *before* the first click (snaps along the wire, not the seed).
- A web worker (Dijkstra per click runs on the main thread at a downscaled resolution — snappy).
- Bézier paths; on-the-fly cost tuning ("training" the wire to the object's edge profile).

## Requirements

- **`core/livewire.ts`** (pure, unit-tested, **no opencv**) — `buildLiveWire(gray, w, h)`:
  - `edgeCost` — Sobel gradient magnitude → per-pixel cost (≈ floor on strong edges, ≈ 1 on flat);
  - `setSeed(x,y)` — Dijkstra (binary min-heap) shortest paths from the seed over the 8-connected
    grid;
  - `pathTo(x,y)` — back-walk the predecessor array → the edge-following path (seed-first).
- **`LassoEditor`** (`PhotoOverlay`, `tool === 'lasso'`) — builds the cost map from the framed photo
  (downscaled grayscale, ≤ 480 px); **click** to start / drop an anchor, **move** to preview the
  live wire, **click the first anchor or double-click** to close, **Backspace** to undo the last
  anchor, **Esc** to cancel. Renders the committed path + the dashed live wire + anchor dots (the
  first turns green when the cursor is in closing range). Works in working px; the closed ring is
  scaled back to framed px.
- **Flow** — `Workspace.onLasso(ring)` → `setEditedContour(simplifyForEdit(ring))` + enter
  `'contour'` mode (the node editor). Everything downstream is unchanged (offset/pocket/3D/PDF/undo).
- **UI** — a **Magnetic lasso** button (lucide `Lasso`) in the Détourage section + a one-line hint.
  i18n FR/EN.

## Acceptance criteria

- [ ] `core/livewire` unit tests: the shortest path **snaps onto an edge**, is 8-connected, and
      `edgeCost` is low on edges / high on flat areas.
- [ ] Tracing + closing a loop produces an **editable contour** (node editor opens) — verified by a
      headless test (clicks → closed contour → editor), **0 console errors**.
- [ ] No opencv import; `livewire` is WASM-free; full `vitest run` green (no hang).
- [ ] `typecheck` / `lint` / `build` clean. CHANGELOG `[Unreleased]` entry.

## Scope

**In:** `core/livewire.ts` (+ tests), `LassoEditor`, the `'lasso'` tool wiring (PhotoOverlay /
Workspace / OutlinePanel), the ControlsPanel button + hint, i18n, this spec + index row. **Out:**
worker offload, seed magnet, GrabCut (036, on hold), Bézier.
