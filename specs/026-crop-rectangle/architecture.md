# Architecture 026 — crop rectangle with handles

## Where it lives

- **`src/vision/photo-transform.ts`** — pure crop-zone geometry (testable, no DOM):
  - `defaultCropBox(margin = 0.08): CropRect` — a centred inset rectangle.
  - `CropHandle = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w'`.
  - `resizeCropBox(box, handle, px, py): CropRect` — drag a handle to a normalised pointer
    `(px,py)`; the handle's letters say which edges follow (`w`/`e`/`n`/`s`); enforces a min side
    (`MIN_CROP`) and clamps to `[0,1]`.
  - `moveCropBox(box, dx, dy): CropRect` — translate, clamped so the box stays inside `[0,1]`.
  - Reuses the existing `normaliseCrop` for redraw (two points → rect).

- **`src/features/workspace/PhotoOverlay.tsx`** — crop mode owns the live **draft** zone:
  - State `cropBox: CropRect | null`, initialised to `defaultCropBox()` when `tool === 'crop'`,
    cleared otherwise.
  - Pointer logic branches by `tool`: brush (paint) / straighten (line) / **crop** (move /
    resize / redraw). Hit-testing finds a handle (display-px proximity), else inside → move,
    else → redraw. Resize/move update `cropBox` via the pure helpers.
  - Render (only in crop mode): a dimmed-outside mask (4 `<rect>` in a `0..100` viewBox), a
    **red dashed border** `<div>` at the box %, and 8 handle dots. A floating **Appliquer /
    Annuler** toolbar (on the photo).
  - **Apply** converts the box to two image-px corners and calls the existing `onCrop(p1, p2)`.
    **Annuler** calls a new `onCancelCrop()`.

- **`src/features/workspace/Workspace.tsx`** — `onCrop` now also `setFrameTool('none')` (apply
  exits crop mode); `onCancelCrop = () => setFrameTool('none')`. Both threaded via `OutlinePanel`.

- **`src/features/workspace/ControlsPanel.tsx`** — the **Rogner** Toggle becomes a full-width
  **`Crop`-icon button** that toggles `frameTool` 'crop'/'none', highlighted when active.

## Why a draft inside `PhotoOverlay` (not lifted)

The zone is a transient editing artefact; only the **applied** crop (`cropRect`) is app state.
Keeping the draft local to `PhotoOverlay` avoids threading a fast-changing rect (and its setter)
through `Workspace`/`OutlinePanel` on every pointer move, and keeps apply/cancel as two small
callbacks. The on-photo toolbar puts the confirm where the user's eyes are (on the zone).

## Why apply-on-confirm (not live)

Each crop change re-runs the full vision pipeline (~2–3 s, a brief freeze). Live resizing would
trigger many re-analyses. A single **Appliquer** keeps it to one. This matches the one-shot
nature of the other framing gestures.

## Coordinate spaces

- `cropBox` is **normalised** `[0,1]` of the *current displayed (transformed)* image — robust to
  canvas resize. Handle hit-testing converts to display px via the canvas rect; rendering uses
  `%`. Apply converts to image px (`analysis.width/height`) for `onCrop`, which `composeCrop`s
  into the rotated-image space (progressive crop), exactly as spec 024.

## Testing

- Unit (vitest): `defaultCropBox`, `resizeCropBox` (each handle, min-size + clamp), `moveCropBox`
  (clamp at edges). The DOM interaction is a manual visual check (canvas, like the rest of the
  overlay).
