# Architecture 037 — magnetic lasso (live-wire)

## The engine (`core/livewire.ts`, pure)

Classic Mortensen–Barrett **Intelligent Scissors**, in plain TS (no opencv → unit-testable,
WASM-free, no CI-hang risk):

1. **Cost map** — Sobel gradient magnitude per pixel, normalised; `cost = floor + (1-floor)·(1 -
   g/max)` so a strong edge ≈ `0.02` and a flat area ≈ `1`. Traversing edges is cheap.
2. **Dijkstra** (`setSeed`) — single-source shortest paths from the seed over the 8-connected grid;
   step weight = `cost(neighbour) · (diagonal ? √2 : 1)`. A compact **binary min-heap** in parallel
   typed arrays (lazy deletion) keeps a ~170 k-node solve at tens of ms.
3. **Back-walk** (`pathTo`) — follow the predecessor array from the cursor pixel to the seed →
   the edge-following path; cheap, so it runs on every mouse-move.

Coordinates are working px; the caller scales. Tested: the cheapest path between two points on a
synthetic edge snaps onto the edge column and is 8-connected.

## The interaction (`LassoEditor`)

Mounted only for `tool === 'lasso'`. On mount it builds the cost map from the framed photo:
draw `imageRef` → a **≤ 480 px** canvas → grayscale `Float32Array` → `buildLiveWire`. Then:

- **move** → `cursor`; `live = lw.pathTo(cursor)` (the snapping wire from the last anchor).
- **click** → first click seeds; later clicks append `lw.pathTo(cursor).slice(1)` to the committed
  path, push an anchor and **re-seed** (Dijkstra) from there. A click within the close radius of the
  **first** anchor (≥ 2 anchors) closes.
- **double-click** closes; **Backspace** rewinds one anchor (a `marks` stack records the committed
  length per anchor, so the path truncates exactly + re-seeds from the previous anchor); **Esc**
  cancels.

Rendering is an SVG with `viewBox = working px` + `preserveAspectRatio="none"` over the canvas rect
(same trick as the grid / contour editor): committed path (solid) + live wire (dashed) + anchor dots
(`non-scaling-stroke`; a measured display scale keeps dots + the close radius constant on screen).
The first dot turns **green** when the cursor is in closing range. A light veil dims the photo for
focus. The canvas auto-contour is suppressed while lassoing.

## Flow & composition

`onLasso(ring)` (framed px) → `setEditedContour(simplifyForEdit(ring))` → `setFrameTool('contour')`.
So the lasso **proposes** a boundary and the node editor (035) **refines** it — the same landing
point as GrabCut (036). Nothing downstream changes: offset, pocket, 3D, PDF and undo/redo already
consume `editedContour`.

## Why pure TS, not opencv

opencv.js's standard build doesn't ship the contrib `IntelligentScissorsMB`. Implementing the
~170-line live-wire ourselves is small, gives full control of the cost function, keeps it
**unit-testable**, and — crucially — avoids pulling the cv WASM into any static import graph (the
spec-026 collection-hang). `livewire` imports nothing heavy; `LassoEditor` only uses a canvas to
build the grayscale.
