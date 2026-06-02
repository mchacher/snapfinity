# Plan — 013 contour extraction + live tuning

## Implementation steps (dependency order)

1. **Pure `core/contour.ts` + tests** — `simplify`, `chaikin`, `smoothContour`. (No cv/DOM.)
2. **cv `vision/contour-cv.ts`** — `outerContour(mask)` (findContours RETR_EXTERNAL, largest).
3. **`analyze.ts`** — call `outerContour` on the cleaned mask; return `outline: Point2D[]`.
4. **`PhotoOverlay`** — draw optional `contour` (solid) + `offsetContour` (dashed) polylines.
5. **`OutlinePanel`** — smoothing + clearance sliders; compute `smoothed = smoothContour(
   outline, factor)` and `offset = scale ? offsetPolygon(smoothed, offsetMm/scale) : null`;
   pass both to the overlay. Add `smoothingFactor` to `Params`.
6. **i18n** — `params.smoothing` (FR « Lissage » / EN "Smoothing").

## Task breakdown

- [x] `core/contour.ts` (`simplify`, `chaikin`, `smoothContour`) + `contour.test.ts` (9)
- [x] `vision/contour-cv.ts` (`outerContour`) ; `analyze.ts` returns `outline`
- [x] `PhotoOverlay` draws contour + offset contour
- [x] `OutlinePanel` sliders + live recompute ; `Params.smoothingFactor` ; clearance moved here
- [x] i18n label (`params.smoothing`)
- [x] typecheck / lint / test (64) / build green ; `verify:seg` now draws contour+offset on real
      photos (end-to-end check) ; in-app slider feel pending user

## Test plan (written before code)

| Module | Nominal | Edge | Type |
| ------ | ------- | ---- | ---- |
| `simplify` | collinear points on a straight edge are dropped; a square stays a square | tolerance 0 → unchanged; < 3 pts → unchanged | unit |
| `chaikin` | one pass on a closed square → 8 corner-cut points within the hull | 0 iters → unchanged; wraps last→first edge | unit |
| `smoothContour` | factor 0 ≈ faithful; factor 1 → no sharp 90° corner, stays a closed ring ≥ 3 pts | empty / < 3 pts → returned as-is | unit |
| `offsetPolygon` (reuse) | already tested in 005 | inset collapse → `[]` | (existing) |
| `outerContour` (cv) | mask rectangle → 4-ish corner ring around it | empty mask → `[]` | **manual / verify** |
| Overlay + sliders | contour + offset drawn; both track the sliders live | no scale → no offset ring | **manual visual** |

**Manual/visual:** `npm run dev` → Outline tab, upload a white-background photo → the contour
hugs the object; raising **Smoothing** rounds/​de-pixelates it; raising **Clearance** grows the
dashed offset ring outward. cv `outerContour` is exercised by the real photo (and can be spot-
checked by drawing it in `verify:seg` if needed).

## Out of scope (next)

- 014: mask **brush** (paint/erase) to correct the auto mask before contouring.
- 014/015: feed the offset contour into the **3D pocket** → preview/export the real bin.
- Later: interior holes; left panel going tab-contextual.
