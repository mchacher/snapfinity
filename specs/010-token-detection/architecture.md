# Architecture — 010 token detection

## Pipeline stage(s) touched

Detection + calibration — produces the mm/px scale that sizes everything downstream.

## Modules

- `src/vision/cv.ts` — `loadOpenCv()` (idempotent WASM init via `@techstark/opencv-js`); `Mat` type.
- `src/vision/token.ts`:
  - `largestContour(gray)` — biggest external contour (builds the reference token contour).
  - `detectToken(gray, refContour, opts)` — gray → Gaussian blur → Otsu inverse threshold →
    `findContours` (external) → for each contour above a min area, `matchShapes` vs the
    reference → keep the lowest score → `minEnclosingCircle` → scale `OD / (2·r)`.
- `src/vision/cv-image-node.ts` — `grayFromJpegFile` (jpeg-js + matFromImageData). **Node-only**
  (used by the verify script); the browser will decode via a canvas.
- `public/token-ref.jpg` — bundled reference token (copied from the oracle's `token.jpg`).
- `tools/cv/verify.ts` — runs detection on the whole `dataset/raw`, prints score/scale + pass rate.

## Why matchShapes (not circularity)

The token is a 6-fold star, not a smooth disc — its outer contour has lower circularity than
e.g. a scissors-handle loop, so "most circular" mis-fires (verified). `matchShapes` (Hu
moments) against a reference token contour is invariant to scale/rotation and keys on the
distinctive star shape. Result: **36/36** on the dataset (scores 0.11–0.61, threshold 0.7).

## Memory

opencv.js Mats are manually freed (`.delete()`) after use in every helper.

## Follow-ups

- **Confidence**: add the 6-hole / 6-fold symmetry check to harden `found` (reject when no
  token is present) and tighten the score threshold.
- **Browser image loader** + wire detection into the photo dropzone (e2e).
- opencv.js bundles (~8 MB) only when the app imports the vision module — lazy-load it then.
