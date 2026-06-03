# Architecture — 024 photo framing

## Stage touched

A **pre-processing** step at the front of the vision pipeline (photo decode → **rotate + crop**
→ token + segmentation → …). Everything downstream is unchanged; it just sees a transformed
image.

## Pure math (`src/vision/photo-transform.ts`) — unit-tested

```
straightenAngleDeg(p1, p2): number
  // angle to rotate so the line p1→p2 becomes axis-aligned, SNAPPED to the nearer axis
  // (horizontal if |lineAngle mod 180| < 45, else vertical). Returns the delta rotation (deg).

normaliseCrop(p1, p2, w, h): { x, y, w, h }   // drag → normalised [0,1] rect, clamped
```

## Canvas transform (browser)

`transformPhoto(originalImageData, straightenDeg, cropRect): ImageData` — rotate by
`straightenDeg` then crop, via an `OffscreenCanvas`/canvas. Browser-only (the whole vision
pipeline already is). Empty corners from the rotation are left blank until cropped.

## Pipeline integration (`analyze.ts`)

The cache is re-keyed so the **file is decoded once**, and the transform-derived work re-runs
only when the framing changes (not on brightness/contrast):

```
cache key = (file, straightenDeg, cropRect)
  → transformedImageData = transformPhoto(originalDecode, straightenDeg, cropRect)
  → grayMat + seg320 from it → detectToken(gray)   // token now reflects the framing
brightness/contrast/flatten → still only re-run adjust(seg320) + u2netp (as today)
```

`PhotoAnalysis.imageData` becomes the transformed image; the overlay + contour already work in
that space, so they stay aligned.

## UI

- `PhotoOverlay` gains a `tool: 'brush' | 'straighten' | 'crop'` prop + `onStraighten(p1,p2)` /
  `onCrop(p1,p2)` callbacks; it draws the in-progress line / crop rectangle. Pointer handling
  branches on `tool`.
- New params: `straightenDeg` (0), `cropRect` (null); a `frameTool` selection (UI state).
- A **Cadrage** section (Outline tab) with Redresser / Rogner buttons + Reset; angle readout.

## Files

| File | Change |
| ---- | ------ |
| `src/vision/photo-transform.ts` (+ test) | **new** — pure angle/crop math |
| `src/vision/image-source.ts` / `analyze.ts` | apply transform; cache rework |
| `src/features/workspace/PhotoOverlay.tsx` | tool modes (line + rect drawing) |
| `src/features/workspace/OutlinePanel.tsx` / `ControlsPanel.tsx` | Cadrage section + tool selector |
| `src/features/workspace/Workspace.tsx` / `usePhotoAnalysis.ts` | params + wiring |
| `src/i18n/*` | strings |

## Risks

- **Cache rework** in `analyze.ts` is the delicate part (must keep brightness/contrast cheap).
- **Re-analysis per gesture** (~2–3 s freeze, main thread) — acceptable for one-shot gestures;
  the deferred vision worker removes it later.
- Coordinate mapping (display ↔ rotated image ↔ original) — the pure math is unit-tested; the
  visual alignment is a manual check.
