# Plan — 003 CAD spike

## Implementation steps (done)

1. Feasibility probe: init replicad headless in Node, build a solid, read bbox, export STL. ✓
2. Decide foot source (model in replicad) and spike precision (dimensions first). ✓
3. `src/cad/oc-node.ts` — headless OC init (CJS shim, idempotent).
4. `src/cad/bin.ts` — `binDimensions`, `makeBin` (rounded body + foot chamfer + pocket).
5. `src/cad/bin.test.ts` — geometry tests.
6. `tools/cad/preview.mjs` — sample STL generator; `out/` gitignored; `tools/`/`out/` lint-ignored.
7. `@types/node`, `tsconfig types: ["node"]`.
8. Update root architecture + CLAUDE docs.

## Task breakdown

- [x] OC headless init helper
- [x] `makeBin` + `binDimensions` + constants
- [x] geometry tests (bbox 1×1/2×1/3×2 + STL non-empty)
- [x] sample generator + sample STL produced
- [x] docs updated (root architecture, CLAUDE)
- [x] four checks green locally
- [x] PR + CI green (#3, merged)

## Test plan

replicad geometry can't be eyeballed in CI, so we assert **dimensional invariants** on the
built solid (the strongest cheap check) plus a non-empty STL.

| Module      | Scenario                              | Expected                                   |
| ----------- | ------------------------------------- | ------------------------------------------ |
| bin         | `binDimensions(2×1 h3)`               | `{83.5, 41.5, 25.75}`                      |
| bin         | `binDimensions(1×1 h1, pitch 36)`     | width 35.5                                 |
| bin         | `makeBin(1×1 h3)` outer bbox          | ≈ 41.5 × 41.5 × 25.75                       |
| bin         | `makeBin(2×1 h3)` outer bbox          | ≈ 83.5 × 41.5 × 25.75                       |
| bin         | `makeBin(3×2 h5)` outer bbox          | ≈ 125.5 × 83.5 × 39.75                      |
| bin         | `makeBin(2×1 h3).blobSTL()`           | byteLength > 1000 (non-empty mesh)          |

**Manual/visual**: `out/snapfinity-2x1.stl` opens in a slicer and looks like a hollow bin
with a chamfered foot.

**Meta-validation**: typecheck/lint/build green, CI green on the PR.
