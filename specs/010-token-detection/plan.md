# Plan — 010 token detection

## Steps (done)

1. De-risk opencv.js in node; find that "most circular" mis-fires → switch to `matchShapes`.
2. Validate visually (overlays) — circle lands on the token across backgrounds.
3. `cv.ts` (loader), `token.ts` (`detectToken`, `largestContour`), `cv-image-node.ts`.
4. Bundle `public/token-ref.jpg`; `tools/cv/verify.ts` + `npm run verify:vision`.
5. Move the vision check out of Vitest (opencv WASM hangs there) → tsx script.

## Task breakdown

- [x] opencv loader + token detection module
- [x] reference token + node image helper
- [x] verify script (whole dataset)
- [x] **36/36 (100%)** detection
- [x] typecheck / lint / vitest / build green (opencv not bundled)
- [x] PR + CI green (#11, merged)

## Validation

| Check | Result |
| ----- | ------ |
| `npm run verify:vision` | 36/36 detected; scores 0.11–0.61 (< 0.7); plausible scales |
| overlay images (manual) | detected circle centred on the token (scissors / wrench / pen) |
| Vitest suite | 43 pass (vision excluded — opencv/WASM incompatible with Vitest) |

**User-in-the-loop later:** harden confidence (no-token case) and confirm calibration accuracy
against a caliper-measured token OD.
