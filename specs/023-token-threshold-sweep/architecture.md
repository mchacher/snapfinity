# Architecture — 023 token threshold sweep

## Stage touched

**Vision / token detection** only (`src/vision/token.ts`). No segmentation, offset, CAD, or UI
change. Calibration math unchanged.

## Change

Extract the per-threshold work into a helper and sweep:

```
const DARK_CUTS = [55, 70, 85, 100, 115];   // strict → lenient, incl. the original 100

detectAtCut(gray, ref, darkCut, minAreaFraction): { score, radius, x, y }
  // = today's body: thresholded(gray, darkCut) → findContours(RETR_EXTERNAL)
  //   → best matchShapes candidate ≥ minArea → minEnclosingCircle

detectToken(gray, ref, options):
  best = min over DARK_CUTS of detectAtCut(...)   // lowest matchShapes score
  found = best.score <= maxScore && best.radius > 0
```

The token's clean silhouette gives the lowest score at the cut that drops the shadow, so the
sweep self-selects it. `100` is in the set → a photo that was already fine keeps its result
(can only improve).

**Cost:** `detectToken` runs once per photo (cached in `analyze.ts`), so the sweep is `|DARK_CUTS|`
× a one-off — a few extra ms, not per interaction.

## Files

| File | Change |
| ---- | ------ |
| `src/vision/token.ts` | sweep `DARK_CUTS` in `detectToken`; extract `detectAtCut` |
| `tools/cv/verify.ts` | accept `.jpg` + `.jpeg` (so new fixtures are picked up) |
| `dataset/raw/scissors-token-shadow.jpeg` | **new** fixture (token with a shadow) |

## Validation

`npm run verify:vision` — the oracle. Expect 37/37 maintained + the shadow photo's score to
drop sharply. (opencv.js can't init under vitest, so this script is the check — same pattern as
spec 010.)

## Risks

- A stricter cut could let a non-token contour win for some photo → false scale. Mitigated by
  `maxScore` + the full-dataset oracle (scales asserted in `[0.05, 0.6]`).
- Slightly higher one-off detection time — negligible (cached, once per photo).
