# Plan — 005 polygon offset

## Steps (done)

1. Install `clipper-lib`; verify offset of a 10×10 square by +1 → bbox −1..11.
2. `src/core/offset.ts` — `offsetPolygon` (scale, ClipperOffset, rescale).
3. `src/types/clipper-lib.d.ts` — ambient types.
4. Tests.

## Task breakdown

- [x] `offsetPolygon` + `Point2D`
- [x] ambient types for clipper-lib
- [x] tests (outward, inward, collapse, guards)
- [x] four checks green locally
- [ ] PR + CI green

## Test plan

| Scenario | Expected |
| -------- | -------- |
| square(10) offset +1 | bbox −1..11 on X and Y |
| square(10) offset −1 | bbox 1..9 |
| square(10) offset −10 | `[]` (collapsed) |
| < 3 points / NaN delta | throws |

Pure logic → 100 % unit-tested; no oracle/manual needed.
