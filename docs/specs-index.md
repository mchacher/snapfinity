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
| 013 | [contour](../specs/013-contour/) | ✅ Done | Outer contour + live **smoothing**/**clearance**, contextual left panel, header-tab layout, green-mask opacity, **detection threshold**, **brightness/contrast** + **flatten background** (anti-shadow). Iteration 8 (part 2). |
| 014 | [mask-brush](../specs/014-mask-brush/) | ✅ Done | Manual **add/erase brush** on the mask to fine-tune; edits composited over the auto mask (persist across auto-params), contour re-derives live. Iteration 8 (part 3). |
| 015 | [pocket-e2e](../specs/015-pocket-e2e/) | ✅ Done | Feed the offset contour (→ mm, centred) into the bin **pocket** — real object-shaped cavity in the 3D preview + STL/STEP. CAD rebuild gated to the Preview tab. Iteration 9. |
| 016 | [webgpu-pocket-perf](../specs/016-webgpu-pocket-perf/) | ✅ Done | Perf step 1/3: u2netp on **WebGPU** (auto WASM fallback) + **decimate the pocket polygon** (Douglas–Peucker 0.2 mm) before the replicad cut. No behavioural change. Iteration 10. |
| 017 | [cad-worker](../specs/017-cad-worker/) | ✅ Done | Perf step 2/3: move the replicad **build + mesh + export to a web worker**. The shape stays in the worker (WASM handle); main thread gets transferable mesh arrays + export blobs. Preview stays interactive during rebuild; export no longer freezes. Iteration 10. |
| 018 | [3d-transparency](../specs/018-3d-transparency/) | ✅ Done | Preview **opacity slider** (Render section, 0.2–1, default 0.75) — translucent bin (`depthWrite` off) to see the pocket through the walls. Preview-only, no geometry/export change. Iteration 11. |
| 019 | [pdf-plan](../specs/019-pdf-plan/) | ✅ Done | **Printable 1:1 top-view PDF** (pdf-lib): object outline (solid) + pocket (dashed) at true scale, 50 mm control ruler, print-at-100% header, A4 multi-page tiling. Header "Plan PDF" button, gated on a calibrated contour. Iteration 12. |
| 020 | [grip-notches](../specs/020-grip-notches/) | ✅ Done | **Two-finger pinch grip** — a symmetric pair of vertical finger scoops at the object's edge (X/Y offsets); cut in the CAD worker (base bin cached for snappy moves). Iteration 13. |
| 021 | [straighten-contour](../specs/021-straighten-contour/) | ✅ Done | **Straighten near-axis contour edges** — toggle + tolerance; snaps wobbly edges to the object's dominant axis (0°/90°), crisp corners (no rounding). Pure `core/contour` (`refineContour`/`rectifyStraightEdges`), flows into the pocket. Iteration 14. |
| 022 | [publish-site](../specs/022-publish-site/) | ✅ Done | **Site publication** (host-agnostic): configurable Vite `base` (`BASE_PATH`), a **manual** GitHub Pages deploy workflow, README deploy docs (GH Pages + Cloudflare). Host choice deferred. Iteration 15. |
| 023 | [token-threshold-sweep](../specs/023-token-threshold-sweep/) | ✅ Done | **Robust token detection**: sweep several dark cuts and keep the best match → a shadow under the token no longer distorts it (auto, no slider). Dataset oracle: 37/37, worst score 0.36 → 0.11. Iteration 16. |
| 024 | [photo-framing](../specs/024-photo-framing/) | In review | **Photo framing**: **straighten** (draw a 2-point line → photo rotates, snaps H/V) + **crop** (drag a rectangle), applied before analysis so token/scale/contour/3D/PDF re-derive. Decode-once cache; pure transform math unit-tested. Iteration 17. |

> Workflow: use the `snapfinity-feature` skill. One feature = one spec = one `feat/`
> branch = one PR. Never skip a gate.
