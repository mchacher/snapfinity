# Architecture 035 — editable contour

## The single override seam

`Workspace` computes `autoContour = refineContour(editedMask.outline, …)`. We add
`editedContour: Point2D[] | null` state and define `contour = editedContour ?? autoContour`.
Everything downstream already reads `contour` — `offsetContour = offsetPolygon(contour, …)`,
`footprintMm`, the PhotoOverlay draw props, the PDF — so the override is one line. Once
`editedContour` is set, auto-contour changes are ignored downstream until reset (manual wins).

`editedContour` is cleared when the framing/photo changes (a new analysis → stale), seeded on
entering edit mode from `simplifyForEdit(autoContour)`.

## Coordinates & the editor overlay

Contour points live in **full-res framed-image px**; the canvas draws them scaled by
`scale = min(1, 1024/max(w,h))`. The editor doesn't draw on the canvas (that would `putImageData`
the whole photo on every drag). Instead, in `tool === 'contour'`, `PhotoOverlay` renders, above the
(dimmed) canvas:

- a **dimming veil** — `absolute inset-0 bg-white/60` — so the photo recedes;
- an **SVG** `viewBox="0 0 {w} {h}" preserveAspectRatio="none"` covering the canvas rect (same trick
  as the alignment grid): the polygon `<path>` (non-scaling stroke) + a `<circle>` handle per node.
  Plotting in image-px means no display-size measurement; handle radius is image-px
  (`clamp(min(w,h)·0.012, …)`) so it reads ~constant on screen because the SVG is stretched to the
  displayed canvas rect.

The canvas auto-contour draw is suppressed while editing (pass `contour=[]`/a flag) so there's no
double line.

## Interactions

Pointer → image px via the existing `toImg`. Hit-tests run in image px with a threshold ∝ handle
radius:
- **pointerdown on a node** → start dragging it; updates a **local** working copy (cheap SVG
  re-render) for a smooth drag; **commit** to `editedContour` (Workspace) on **pointerup** so the
  offset/pocket recompute once per edit, not per frame.
- **pointerdown on a segment** (not near a node) → `insertNode` at the projection, then drag it.
- **dblclick on a node** → `deleteNode` (keep ≥ 3).

`core/contour.ts` gains pure, tested helpers: `simplifyForEdit(ring, {target,max})` (raise the
`simplify` tolerance until node count ≤ max), `nearestNode(ring, p, maxDist)`,
`nearestSegment(ring, p, maxDist)` → `{index, point}`, and `moveNode/insertNode/deleteNode`.

## Undo/redo

`useUndoRedo`'s `Snapshot` gains `editedContour: Point2D[] | null`. `snapshot()` captures it (a
shallow point-array copy), `restore()` calls `setEditedContour`. Coalescing already groups a drag
into one step (the commit happens on pointerup). No change to the pure `history.ts` stack.

## UI

`ControlsPanel` (Détourage section) gets a *Modifier le contour* button (toggles `frameTool`
`'contour'`); in edit mode it shows *Réinitialiser le contour* + *Terminer* and a one-line hint
(drag / click-segment / double-click). A small "contour manuel" badge shows when `editedContour` is
set. i18n keys under `params`.
