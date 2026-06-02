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
| 007 | [cad-refinements](../specs/007-cad-refinements/) | ✅ Done | Foot → spec 4.75 mm; STL mesh tolerance (2×1: 17.5 MB → 0.84 MB). |
| 008 | [ui-foundation](../specs/008-ui-foundation/) | ✅ Done | React + Tailwind design system + single-workspace shell (flat sections, azure accent) + i18n FR/EN. Iteration 4 (part 1). |
| 009 | [preview-export](../specs/009-preview-export/) | ✅ Done | Live three.js preview (replicad in-browser) + STL/STEP export. Iteration 4 (part 2). |
| 010 | [token-detection](../specs/010-token-detection/) | ✅ Done | Token detection + calibration (opencv.js matchShapes); 36/36 on the dataset. Iteration 6. |
| 011 | [segmentation](../specs/011-segmentation/) | ✅ Done | Object matting (u2netp ONNX) + token exclusion → tool silhouette. Iteration 7. |
| 012 | [browser-vision](../specs/012-browser-vision/) | ✅ Done | Vision in the browser: photo upload → token + u2netp mask, **live overlay** + auto-size. onnxruntime-web, shared `cleanMask`, 2-tab layout. Iteration 8 (part 1). |
| 013 | [contour](../specs/013-contour/) | Draft | Outer contour from the mask + live **smoothing** & **clearance** sliders (pure `simplify`/`chaikin`/`offset`), drawn over the photo. Iteration 8 (part 2). |

> Workflow: use the `snapfinity-feature` skill. One feature = one spec = one `feat/`
> branch = one PR. Never skip a gate.
