# Architecture — 013 contour extraction + live tuning

## Pipeline stage

Bridges segmentation (012) → pocket (014/015). Stops at the **2D offset contour** drawn live.

```
mask (012) ──cv.findContours (in analyzePhoto, once)──▶ outline: Point2D[] (full-res px)
                                                              │
   smoothingFactor ─▶ smoothContour = chaikin(simplify(outline, tol), iters)   ← pure, live
                                                              │
   offsetMm, scale ─▶ offsetPolygon(smoothed, offsetMm/scale)                   ← pure, live
                                                              ▼
                      PhotoOverlay: photo + mask tint + token + smoothed (solid) + offset (dashed)
```

## New / changed files

| File | Role |
| ---- | ---- |
| `src/core/contour.ts` | **new, pure** — `simplify` (Douglas–Peucker), `chaikin` (closed-ring corner cut), `smoothContour(points, factor)`. |
| `src/core/contour.test.ts` | **new** — unit tests for the above. |
| `src/vision/analyze.ts` | **edit** — compute + return `outline: Point2D[]` (largest external contour of the cleaned mask, full-res px). |
| `src/vision/contour-cv.ts` | **new** — `outerContour(mask: Mat): Point2D[]` (cv `findContours` RETR_EXTERNAL, largest by area → points). Kept cv-isolated. |
| `src/features/workspace/PhotoOverlay.tsx` | **edit** — optional `contour` + `offsetContour` props, drawn as scaled polylines. |
| `src/features/workspace/OutlinePanel.tsx` | **edit** — smoothing + clearance sliders; compute smoothed + offset from `outline` + params; pass to overlay. |
| `src/features/workspace/Workspace.tsx` | **edit** — add `smoothingFactor` to `Params`. |
| `src/core/offset.ts` | **reuse** — `offsetPolygon` (no change). |
| `src/i18n/{en,fr}.ts` | **edit** — `params.smoothing` label. |

## Data shapes

```ts
// analyze.ts — PhotoAnalysis gains:
outline: Point2D[];   // [] when no object;  Point2D = [number, number] (full-res px)

// core/contour.ts
function simplify(points: Point2D[], tolerancePx: number): Point2D[];
function chaikin(points: Point2D[], iterations: number): Point2D[];        // closed ring
function smoothContour(points: Point2D[], factor: number): Point2D[];      // factor 0..1
```

## Key decisions

- **`outline` computed once** (cv) during analysis; **smoothing + offset are pure and live**.
  A contour is a few hundred points → recomputing on every slider tick is trivial, no debounce
  needed for the 2D overlay.
- **`smoothContour(points, factor)`** maps one 0..1 knob to `tolerancePx = factor·6` (simplify)
  + `iters = round(factor·3)` (chaikin). Faithful at 0, smooth/rounded at 1.
- **Units**: the overlay works in **px**; clearance is physical, so `deltaPx = offsetMm/scale`.
  Without a token there's no scale → show the smoothed contour, skip the mm offset.
- **Outer contour only** (decisions #13): `RETR_EXTERNAL`, largest area. Interior holes filled.
- **Controls in the Outline tab** (not the left panel) — the left panel going tab-contextual is
  a later iteration (per the user); co-locating the sliders with the photo is good UX anyway.
- Reuses `offsetPolygon`'s `jtRound` joins — the clearance step already rounds corners, so the
  smoothing slider and the offset compound nicely.
