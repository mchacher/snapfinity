# Spec 021 — straighten near-straight contour edges

## Overview

Backlog feature #4. Many objects (rulers, blades, boxes, handles) have **straight, square
edges** that the photo contour renders as wobbly polylines. Add an option that **detects
near-straight runs and straightens them, snapping to the object's dominant axis (0°/90°)**,
with a **tolerance** slider — for crisp, manufactured-looking pockets.

## Goals

- A "Straighten edges" toggle on the Outline tab + a tolerance slider.
- Near-axis edges become exactly parallel/perpendicular to the object's dominant orientation
  (works even when the object is rotated in the photo).
- Pure, live, and it flows into the pocket (the bin gets the straightened outline).

## Non-goals

- Full polygon regularisation / corner detection beyond axis snapping.
- Snapping to arbitrary angles other than the dominant axis and its perpendicular.
- A separate "straight-only" detector UI; it's one toggle + one tolerance.

## Requirements

- `straightenEdges` toggle (default off) + `straightenToleranceDeg` (default 8°, range 1–20).
- Algorithm (pure, in `core/contour.ts`):
  1. Simplify the outline (existing `simplify`).
  2. Find the **dominant axis** (orientation of the longest edge, mod 90°).
  3. Rotate into that frame; for each edge within `tolerance` of horizontal → equalise its
     endpoints' y (make it flat); within tolerance of vertical → equalise x. Rotate back.
  4. When straightening is on, **skip the Chaikin rounding** (we want crisp corners).
- Closure is preserved (vertices are nudged, not reconstructed).

## Acceptance criteria

- [ ] Enabling straighten turns near-square outlines into crisp axis-aligned ones (live overlay + pocket). *(user to verify)*
- [ ] Works on a rotated object (snaps to its own axis, not the image axis).
- [ ] Diagonal edges (far from the axis) are left untouched.
- [ ] Tolerance 0 / toggle off → no change. Unit-tested; `build`/`lint`/`typecheck` clean.

## Scope

**In:** `rectifyStraightEdges` + `refineContour` in `core/contour.ts` (+ tests); Workspace uses
`refineContour`; `Params` + ControlsPanel toggle/slider (Outline tab); i18n.

**Out:** corner classification, non-axis snapping, separate detector view.

## Edge cases

- **< 3 points** → returned unchanged.
- **No clear dominant edge** (blobby shape) → axis from the longest edge; few/no edges qualify
  → little change (safe).
- **Two adjacent near-horizontal edges** → each equalises its own y (last write wins); visually
  fine. Corners (H meets V) snap independently (different coordinates) — the common case.
