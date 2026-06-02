# Spec 010 — Token detection + calibration

## Overview

Iteration 6 (core). Detect the calibration **token** in a photo and derive the **mm/px scale**.
The token is a distinctive **6-fold star** — a "most circular contour" heuristic fails (it
picks a smooth object part, e.g. a scissors handle), so we match the token's **shape**
(`matchShapes` against a reference contour), as the oracle did. Core module + dataset
verification; wiring into the UI comes with the end-to-end flow.

## Goals

- `detectToken(gray, refContour)` → `{ found, scaleMmPerPx, centerPx, radiusPx, score }`.
- Robust across the 36-photo dataset (white / wood, chrome / dark / low-contrast objects).
- Reference token bundled in the repo (`public/token-ref.jpg`).

## Non-goals

- UI wiring (photo upload → detection overlay) — with the e2e flow.
- Object segmentation / contour (it 7).
- 6-hole symmetry confidence — a later refinement of the score threshold.

## Requirements

- **R1** — opencv.js (WASM) loader (`loadOpenCv`), works in the browser and in node scripts.
- **R2** — `detectToken` picks the best `matchShapes` contour (min area filter), returns scale
  from `TOKEN_OD_MM / (2·radius)`; `found` when the best score ≤ threshold (0.7).
- **R3** — Verified on the **whole dataset** via `npm run verify:vision`.

## Acceptance criteria

- [x] `src/vision/cv.ts` (loader), `src/vision/token.ts` (`detectToken`, `largestContour`)
- [x] `public/token-ref.jpg` reference; node image helper `cv-image-node.ts`
- [x] `npm run verify:vision` (tsx) — **36/36 detected (100%)** on the dataset
- [x] `npm run typecheck | lint | test | build` green; opencv NOT bundled (no UI import yet); CI green

## ⚠️ Note — opencv.js does not run under Vitest

The emscripten WASM hangs at init inside Vitest's environment. So the vision check is a **tsx
script** (`npm run verify:vision`) importing the real module — not a Vitest test. The pure
CAD/logic suite stays in Vitest. Wiring detection into the browser UI uses a canvas image
loader (not `cv-image-node`, which is node-only).
