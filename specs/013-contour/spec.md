# Spec 013 — Contour extraction + live tuning (smoothing + clearance)

## Overview

Iteration 8 (part 2). Turn the segmentation **mask** (from 012) into the **outline** that will
become the pocket, and let the user tune it **live** in the Outline tab: a **smoothing**
slider (less pixelation, rounder corners) and a **clearance** slider (printing offset). The
contour redraws over the photo in **real time** as the sliders move — the tool becomes an
interactive visual adjuster, not a one-shot pipeline.

This is the first half of the "détourage" work. The **mask brush** (paint/erase to correct
the auto mask) is the next iteration (014); feeding the offset contour into the **3D pocket**
+ export is iteration 014/015.

## Goals

- Extract the **outer contour** of the isolated mask as a polygon (single outline; interior
  holes are filled — decisions #13). Computed once per analysis (cv), in `analyzePhoto`.
- **Pure, unit-tested contour ops**: `simplify` (Douglas–Peucker) + `chaikin` (corner
  rounding) + `smoothContour(points, factor)` combining them — one knob "faithful → smooth".
- **Clearance** via the existing `offsetPolygon` (clipper), driven by `params.offsetMm`,
  converted px↔mm with the calibration scale.
- **Live overlay**: draw the smoothed contour (solid) + the offset contour (dashed) over the
  photo in the Outline tab; recompute (pure) on every slider tick.
- Controls (smoothing + clearance) live **in the Outline tab**, next to the photo.

## Non-goals (later)

- **Mask brush** (paint/erase to fix the mask) → **014**.
- Offset contour → **3D pocket** + preview/export of the real bin → **014/015**.
- Interior holes (islands/pillars in the pocket) → later (outer-only for now).
- **Left panel becoming tab-contextual** (Outline → contour tools, 3D → bin params) → a later
  UX iteration; for 013 the contour controls sit in the Outline tab itself.

## Requirements

- **R1 — Outer contour.** `analyzePhoto` also returns `outline: Point2D[]` — the largest
  external contour of the cleaned mask (full-res px), or `null`/empty if no object.
- **R2 — Pure contour ops.** `src/core/contour.ts`: `simplify(points, tolerancePx)`,
  `chaikin(points, iterations)` (closed ring), `smoothContour(points, factor)` (factor 0..1 →
  tolerance + chaikin passes). All pure, unit-tested.
- **R3 — Clearance.** Reuse `offsetPolygon(points, deltaPx)` with `deltaPx = offsetMm / scale`
  (skip when there's no scale). Rounded joins already soften corners.
- **R4 — Live overlay.** `PhotoOverlay` draws the smoothed contour + the offset contour;
  the Outline view recomputes both from `outline` + sliders on each change (real-time).
- **R5 — Controls.** Smoothing slider (new `params.smoothingFactor`, 0..1) + clearance slider
  (existing `params.offsetMm`) in the Outline tab.

## Acceptance criteria

- [x] `analyzePhoto` returns `outline` (cv outer contour); `PhotoAnalysis` typed accordingly
- [x] `src/core/contour.ts` (`simplify`, `chaikin`, `smoothContour`) + unit tests (9, synthetic
      polygons: collinear removal, corner rounding, factor clamp, closed-ring wrap)
- [x] Outline tab shows the contour (solid) + offset contour (dashed); sliders recompute live.
      Pipeline proven on real photos via `verify:seg` (contour + offset drawn); **in-app slider
      feel pending user visual check**
- [x] No token / no object → graceful (contour without offset; empty otherwise)
- [x] `npm run typecheck | lint | test (64) | build` green

## Edge cases

| Case | Behaviour |
| ---- | --------- |
| No token (no scale) | Show the smoothed contour without the mm offset; note clearance needs a token |
| No object / empty mask | No contour; keep the "object not found" message |
| Tiny contour (< 3 pts) | Skip smoothing/offset; show nothing rather than throw |
| Heavy smoothing collapses offset inset | `offsetPolygon` returns `[]` → draw only the smoothed contour |

## Note — pure vs cv

Contour **extraction** (mask → polygon) needs opencv.js (`findContours`), so it stays in the
`analyze` adapter and is covered by the Node `verify` path + manual check. **Smoothing +
offset are pure** (`core/contour.ts`, `core/offset.ts`) and unit-tested — and cheap enough to
run on every slider tick for the live overlay.
