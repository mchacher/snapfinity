# Architecture — 014 mask brush

## Pipeline stage

Inserts a manual edit between the auto mask (013) and the contour:

```
saliency+threshold ─deriveMask(cv)─▶ base mask (work-res)
                                          │
        edit layer (paint discs) ─────────┤  compositeMask (pure)
                                          ▼
                          effective mask ─outerContour(cv)+maskBBox─▶ effective DerivedMask
                                          │
                       smoothContour → offsetPolygon → overlay + auto-size  (unchanged)
```

## New / changed files

| File | Role |
| ---- | ---- |
| `src/vision/mask-edit.ts` | **new, pure** — `paintDisc(layer,w,h,cx,cy,r,value)`, `compositeMask(base,edit)`. cv-free → unit-tested. |
| `src/vision/mask-edit.test.ts` | **new** — unit tests. |
| `src/vision/analyze.ts` | **edit** — `applyEdits(base, editLayer, fullW, fullH): DerivedMask` (composite → `outerContour` cv → scale outline/bbox to full-res). |
| `src/features/workspace/useMaskEdit.ts` | **new** — owns the edit-layer buffer (sized to the base mask), `paint`/`reset`, a `version` bump; + `useEditedMask(base, editLayer, version, w, h)` (debounced cv recompute). |
| `src/features/workspace/PhotoOverlay.tsx` | **edit** — pointer drag → `onPaint(maskX, maskY)`; draw a brush-cursor ring. |
| `src/features/workspace/OutlinePanel.tsx` | **edit** — wire painting (mode/size) to the edit layer; pass the **edited** mask to the overlay. |
| `src/features/workspace/ControlsPanel.tsx` | **edit** — **Pinceau** section (Outline tab): Ajouter/Enlever, Taille, Réinitialiser. |
| `src/features/workspace/Workspace.tsx` | **edit** — `brushMode`/`brushSize` params; own edit-layer + edited mask; feed contour/auto-size from the edited mask. |
| `src/i18n/{en,fr}.ts` | **edit** — brush labels. |

## Data shapes

```ts
// edit layer: Uint8Array, work-res of the base mask — 0 neutral · 1 force-on · 2 force-off
function paintDisc(layer: Uint8Array, w: number, h: number, cx: number, cy: number, r: number, value: number): void;
function compositeMask(base: Uint8Array, edit: Uint8Array): Uint8Array; // → 0/255
function applyEdits(base: DerivedMask, editLayer: Uint8Array, fullW: number, fullH: number): DerivedMask;
```

## Key decisions

- **Separate edit layer composited over the auto mask** (not baked in) → retouches **persist**
  when Flatten/Threshold/Exposure re-run the auto mask. Layer sized to the base **work-res**;
  re-allocated (reset) when the photo changes.
- **Two hooks**: `useDerivedMask` (auto, re-runs on threshold/flatten/photo) → base; then
  `useEditedMask` (composite + `outerContour`, re-runs on paint or base change). Keeps the
  expensive deriveMask off the paint path.
- **Live feel**: the green tint recomposites cheaply during a stroke; the contour (cv
  `outerContour`) recomputes throttled / on pointer-up. All at work-res (≤1024) → fast.
- **Pure core**: `paintDisc` + `compositeMask` are pure & unit-tested; cv (`outerContour`) and
  pointer handling are validated manually + by the existing verify path.
- Plain **disc brush**, outer-contour only — feathering, lasso, undo, point-editing are later.
