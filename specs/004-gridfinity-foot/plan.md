# Plan — 004 Gridfinity foot + lip

## Steps (done)

1. Fetch + study the official replicad Gridfinity example (socket sweep, lip, tiling).
2. Prototype the port parametrised by pitch (node) — verified bbox for pitch 42/36, lip on/off.
3. Rewrite `src/cad/bin.ts`: socketProfile, buildSocket, cloneOnGrid, buildTopShape, makeBin; no magnets; pitch range.
4. `binDimensions` (outer width/depth/height) + pitch validation.
5. Rewrite tests; replace the throwaway mjs with `tools/cad/sample.ts` (tsx).
6. Update root architecture + CLAUDE docs.

## Task breakdown

- [x] `bin.ts` real foot + lip, parametric pitch (20–84), no magnets
- [x] pitch validation throws out of range
- [x] tests: bbox 42/36/30, range, lip effect, STL (26 tests total)
- [x] `tools/cad/sample.ts` + `npm run sample` + tsx dep
- [x] docs updated
- [x] four checks green locally
- [x] PR + CI green (#4, merged)

## Test plan

| Module | Scenario | Expected |
| ------ | -------- | -------- |
| bin | `binDimensions(2×1 h3)` | width 83.5, depth 41.5, height ≈ 29.63 |
| bin | footprint scales with pitch (36, 30) | width 35.5 / 29.5 |
| bin | pitch < 20 or > 84 | throws |
| bin | `makeBin` bbox for pitch 42/36/30 | matches `binDimensions` |
| bin | lip on vs off | STL byte size differs |
| bin | `makeBin(2×1).blobSTL()` | non-empty |

**Manual/visual**: `out/snapfinity-foot-2x1.stl` shows two chamfered Gridfinity feet + a
stacking lip (verified via OpenSCAD render). Physical baseplate fit = deferred.
