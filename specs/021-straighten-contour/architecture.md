# Architecture — 021 straighten contour edges

## Pipeline stage touched

**Contour** (pure core), between simplify and the offset. Flows into the overlay (px) and the
pocket (mm) like the existing smoothing.

## Core (`src/core/contour.ts`)

```
dominantAxisAngle(points): number            // longest-edge orientation, mod π/2 → [0, π/2)
rectifyStraightEdges(points, toleranceDeg): Point2D[]
  // rotate by -axis (about centroid); for each edge:
  //   near 0°  (|angle mod π| < tol)        → set both endpoints' y to their mean (flat)
  //   near 90° (|(angle mod π) − π/2| < tol)→ set both endpoints' x to their mean (vertical)
  // rotate back by +axis. Closure preserved (vertices nudged in place).

refineContour(points, { smoothingFactor, straighten, straightenToleranceDeg }): Point2D[]
  // simplify(f·6); if straighten → rectifyStraightEdges (crisp, NO chaikin)
  //               else          → chaikin(round(f·3))
```

`smoothContour` is kept (used by existing tests); `refineContour` is the new entry the UI uses.

## Wiring

- `Workspace` `contour` memo: `refineContour(editedMask.outline, { smoothingFactor,
  straighten: params.straightenEdges, straightenToleranceDeg: params.straightenToleranceDeg })`.
- `Params`: `straightenEdges: boolean` (false), `straightenToleranceDeg: number` (8).
- `ControlsPanel` (Outline tab, after Smoothing): toggle + tolerance slider (shown when on).
- i18n: `params.straighten`, `params.straightenTol`.

## Files

| File | Change |
| ---- | ------ |
| `src/core/contour.ts` | **+** `dominantAxisAngle`, `rectifyStraightEdges`, `refineContour` |
| `src/core/contour.test.ts` | **+** rectify cases |
| `src/features/workspace/Workspace.tsx` | use `refineContour`; 2 new params |
| `src/features/workspace/ControlsPanel.tsx` | toggle + tolerance slider |
| `src/i18n/*` | `params.straighten`, `params.straightenTol` |

## Risks

- Shared-vertex conflicts when consecutive edges snap the same coordinate → bounded (one pass,
  last-write-wins); corners (H+V) snap independent coords, the common case. Unit-tested on a
  noisy rectangle (axis-aligned + rotated).
