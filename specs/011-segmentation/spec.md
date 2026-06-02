# Spec 011 — Object segmentation (u2netp)

## Overview

Iteration 7 (core). Extract the **tool's silhouette** from a photo with an ML matting model
(**u2netp**, Apache-2.0, ~4.6 MB), and **isolate the tool** by subtracting the token region
(from detection, it 10). This silhouette → offset → pocket later. Core module + dataset
verification with overlays; the mask quality is the user's call (the bootstrap we agreed).

## Goals

- `rgbaToTensor` / `saliencyToMask` — pure pre/post-processing for u2netp (unit-tested).
- Run u2netp (onnxruntime) on a photo → saliency → binary mask.
- **Isolate the tool**: zero the mask inside the detected token circle.
- Model **self-hosted** (`public/models/u2netp.onnx`), offline after first load.

## Non-goals

- Browser wiring (onnxruntime-web in the app) — with the e2e flow.
- Mask → contour → offset → pocket (e2e it 8).
- Ground-truth `dataset/truth/` — promote user-approved masks later.

## Requirements

- **R1** — Pure `rgbaToTensor` (ImageNet norm, CHW) + `saliencyToMask` (min-max + threshold).
- **R2** — `verify:seg` runs u2netp via onnxruntime + token exclusion → overlays for review.
- **R3** — Model is u2netp (Apache-2.0), bundled in `public/models/`.

## Acceptance criteria

- [x] `src/vision/segment.ts` (pure) + `segment.test.ts` (vitest, 3 tests)
- [x] `public/models/u2netp.onnx` (4.6 MB); `tools/cv/segment-verify.ts` + `npm run verify:seg`
- [x] Overlays show clean tool masks with the **token excluded** (scissors / wrench / mouse)
- [x] `npm run typecheck | lint | test | build` green; onnx/opencv NOT bundled; CI green
- [ ] **User OK on mask quality** (validation gate)

## Note — onnxruntime under Vitest

Like opencv.js, the WASM/native runtime is run via a **tsx script** (`npm run verify:seg`),
not Vitest; the **pure** pre/post functions are unit-tested in Vitest. The browser will use
**onnxruntime-web** + a canvas image loader (wired in the e2e iteration).
