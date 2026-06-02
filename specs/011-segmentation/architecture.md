# Architecture — 011 segmentation

## Pipeline stage(s) touched

Segmentation — photo → tool silhouette (the shape the pocket is cut to).

## Flow

```
photo RGBA → resize 320² → rgbaToTensor (ImageNet norm, CHW)
          → u2netp (onnxruntime) → saliency 320²
          → saliencyToMask (min-max + threshold) → upscale to full size
          → zero the token circle (detectToken, it 10) → TOOL mask
```

## Modules

- `src/vision/segment.ts` — **pure**: `rgbaToTensor(rgba)` (`1×3×320×320` normalised),
  `saliencyToMask(saliency, threshold)` (min-max → 0/255). Unit-tested in Vitest.
- `public/models/u2netp.onnx` — u2netp (Apache-2.0, ~4.6 MB), self-hosted.
- `tools/cv/segment-verify.ts` — onnxruntime-node inference + opencv resize + token exclusion
  + green overlays; `npm run verify:seg <photos…>`.

## Why u2netp + token exclusion

u2netp is salient-object/background removal — it would grab **both** the tool and the token
(both salient). Subtracting the **token circle** (known from it 10) leaves the tool alone.
That's the synergy: detection (it 10) + matting (it 11) → a clean tool silhouette. Validated
on scissors / wrench / mouse (wood + white): crisp masks, handle holes respected, token removed.

## Follow-ups

- **Browser**: onnxruntime-web + canvas loader; lazy-load the model (cache after first load).
- Mask → largest contour → clearance offset (it 5) → pocket (it 3) — the e2e wiring.
- **Ground truth**: promote user-approved masks into `dataset/truth/` for IoU regression.
- Model in git (4.6 MB) — move to Git LFS / release asset if the repo grows.
