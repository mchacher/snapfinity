# Architecture — 015 pocket end-to-end

## Pipeline stage

Connects the contour (013/014) to the CAD pocket (006):

```
edited mask → smoothContour → offsetPolygon (px)
                                   │ contourToFootprintMm(scale)  ← pure
                                   ▼
              footprint (mm, centred, y-up) ──useBin(enabled=Preview)──▶ makeBinWithPocket
                                                                              │ depth = thicknessMm
                                                          three.js preview · STL/STEP export
```

## New / changed files

| File | Role |
| ---- | ---- |
| `src/core/footprint.ts` | **new, pure** — `contourToFootprintMm(offsetPx, scaleMmPerPx)`: bbox-centre, ×scale, negate y → mm polygon centred on origin. |
| `src/core/footprint.test.ts` | **new** — unit tests. |
| `src/features/workspace/useBin.ts` | **edit** — accept `footprintMm: Point2D[] | null`, `thicknessMm`, `enabled`; build `makeBinWithPocket` when enabled + valid, else `makeBin`. Gate the effect on `enabled`. |
| `src/features/workspace/Workspace.tsx` | **edit** — compute contour/offset/footprint (lifted from OutlinePanel via `useMemo`); pass footprint + `enabled = tab==='preview'` to `useBin`; pass px contour/offset to `OutlinePanel`. |
| `src/features/workspace/OutlinePanel.tsx` | **edit** — receive `contour` + `offsetContour` (px) as props instead of computing them. |
| `src/cad/pocket.ts` | **reuse** — `makeBinWithPocket`. |

## Data flow / decisions

- **Coordinate map** (`contourToFootprintMm`): image px (origin top-left, y-down) → bin mm
  (origin centre, y-up). Centre on the offset contour's **bbox centre** so the object sits in
  the middle of the bin; multiply by `scaleMmPerPx`; negate y.
- **Pocket depth** = `thicknessMm`, clamped to `body − floor` in `makeBinWithPocket`.
- **Rebuild gating**: replicad is **main-thread**; cutting a many-point pocket is ~seconds and
  would freeze painting. So `useBin` only (re)builds when `enabled` (Preview tab is active).
  Switching to Preview triggers one build with the current footprint (`Génération…`); painting
  on the Outline tab does no CAD work. Deps: footprint identity + params + enabled, debounced.
- **No scale / no object** → `footprintMm` is `null` → plain `makeBin` (rectangular shell).
- **Lift contour to Workspace**: the px contour/offset (for the overlay) and the mm footprint
  (for CAD) share one source of truth; `OutlinePanel` becomes a pure consumer for drawing.
