# Plan — 024 photo framing

## Steps (straighten first, then crop)

1. [ ] `src/vision/photo-transform.ts` (pure) — `straightenAngleDeg(p1,p2)` (H/V snap) +
   `normaliseCrop(p1,p2,w,h)`. + `photo-transform.test.ts`.
2. [ ] Canvas `transformPhoto(imageData, straightenDeg, cropRect)` (rotate → crop).
3. [ ] `analyze.ts` — decode-once cache re-keyed by `(file, straightenDeg, cropRect)`; apply
   the transform; token + seg run on the transformed image.
4. [ ] `usePhotoAnalysis` — accept `straightenDeg` / `cropRect` (debounced re-run).
5. [ ] `PhotoOverlay` — `tool` modes: draw the straighten line + the crop rectangle; callbacks.
6. [ ] `Workspace` params (`straightenDeg`, `cropRect`) + `frameTool` state; `ControlsPanel`
   **Cadrage** section (Redresser / Rogner / Reset + angle); i18n.

(Land **straighten** end-to-end first, then add **crop**.)

## Test plan

| Module | Scenario | Type |
| ------ | -------- | ---- |
| `photo-transform.ts` `straightenAngleDeg` | horizontal-ish line → small angle; 5° tilt → −5°; near-vertical line → snaps to vertical; exact 45° boundary | unit |
| | `normaliseCrop` | drag → clamped [0,1] rect; reversed drag normalised | unit |
| `transformPhoto` + pipeline | rotate/crop a photo → token re-detects, contour aligns, PDF consistent | **manual visual** |

**Why manual for the image part.** Canvas transform + opencv/onnx can't run under vitest (WASM
+ DOM). The pure geometry is unit-tested; the visual result is checked on a real photo (the
tilted/cluttered case the user has).

## Validation (Gate 4)

```
npm run build / lint / typecheck / test   # clean
```

Manual: load a tilted photo → Redresser (draw a line along a level edge) → photo levels;
Rogner (drag a box) → crops; token + contour + 3D + PDF stay consistent.
