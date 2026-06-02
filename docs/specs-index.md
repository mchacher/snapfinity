# Specs index

Every feature is documented under `specs/NNN-name/` (`spec.md` + `architecture.md` +
`plan.md`). This is the chronological index. Add a row when a spec is created.

| #   | Name | Status | Summary |
| --- | ---- | ------ | ------- |
| 001 | [scaffold-test-harness](../specs/001-scaffold-test-harness/) | ✅ Done | Vite + TS + Vitest + ESLint + CI; `core/` pure-logic convention. Iteration 0. |
| 002 | [calibration-sizing-math](../specs/002-calibration-sizing-math/) | ✅ Done | Pure calibration (px→mm) + Gridfinity sizing (cols×rows, height units), pitch 42/36. Iteration 1. |
| 003 | [cad-replicad-spike](../specs/003-cad-replicad-spike/) | ✅ Done | Parametric Gridfinity bin in replicad (headless tests, STL export); foot modelled in replicad (Python bake dropped). Iteration 2. |
| 004 | [gridfinity-foot](../specs/004-gridfinity-foot/) | ✅ Done | Real Gridfinity foot + stacking lip (adapted from replicad's MIT example), parametric pitch 20–84 mm, no magnets. |
| 005 | [offset-clipper](../specs/005-offset-clipper/) | ✅ Done | Polygon clearance offset (clipper-lib), pure core. Iteration 5. |
| 006 | [tool-pocket](../specs/006-tool-pocket/) | ✅ Done | Tool-shaped pocket cut into the bin (synthetic footprint); `hollow` option; meshing fix. Iteration 3. |
| 007 | [cad-refinements](../specs/007-cad-refinements/) | In review | Foot → spec 4.75 mm; STL mesh tolerance (2×1: 17.5 MB → 0.84 MB). |

> Workflow: use the `snapfinity-feature` skill. One feature = one spec = one `feat/`
> branch = one PR. Never skip a gate.
