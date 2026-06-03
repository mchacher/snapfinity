# Spec 023 — robust token detection via threshold sweep

## Overview

Token detection thresholds the gray at a **fixed dark cut (100)** before shape-matching. When a
**shadow** sits under the near-black token, the shadow (mid-gray) passes that cut and **merges
with the token**, distorting the contour → a poor `matchShapes` score and an inflated/off-centre
enclosing circle (wrong scale). The image sliders (flatten/brightness/contrast) can't help —
they only feed the object segmentation, not token detection.

**Fix:** detect at **several dark cuts and keep the best-scoring match**. The token's true
silhouette wins at the cut that excludes the shadow; the original `100` stays in the sweep so
nothing regresses. Automatic — no new control.

> Measured on `scissors-token-shadow.jpeg`: at cut 100 score = 0.310, r = 186; at cut ~70
> score = 0.037, r = 183 (shadow gone). The sweep picks the good one automatically.

## Goals

- Token detection robust to a shadow / uneven lighting under the token.
- Fully automatic (no slider), no regression on the existing dataset.

## Non-goals

- A manual sensitivity slider (possible later if a case still fails).
- Changing the object segmentation or the calibration math.
- Adaptive/Otsu thresholding (leaks wood grain — that's why a dark cut is used).

## Requirements

- `detectToken` runs the existing detection at each cut in a small set (covering strict →
  lenient, **including 100**) and returns the candidate with the **lowest `matchShapes` score**
  (still gated by `maxScore`).
- Cost is bounded: detection already runs **once per photo** (cached); the sweep multiplies that
  one-off by the number of cuts (small).
- The reference-contour build (`largestContour` on the clean `token-ref.jpg`) keeps the single
  fixed cut.

## Acceptance criteria

- [ ] `scissors-token-shadow.jpeg` score drops from ~0.31 to < ~0.1 (shadow excluded).
- [ ] `verify:vision` stays **37/37** on the dataset (no regression); scales stay plausible.
- [ ] `build` / `lint` / `typecheck` clean. *(token.ts can't run under vitest — opencv WASM;
      validated by the `verify:vision` oracle, per the workflow.)*

## Scope

**In:** `src/vision/token.ts` (sweep in `detectToken`); add the shadow photo as a dataset
fixture; `verify.ts` accepts `.jpg`/`.jpeg`.

**Out:** UI, manual slider, segmentation changes.

## Edge cases

- **No token** → every cut scores above `maxScore` → `found: false` (unchanged behaviour).
- **A non-token contour scoring low at some cut** → guarded by `maxScore`; the dataset oracle
  confirms no false calibration.
