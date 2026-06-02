# Roadmap — incremental iterations

The agreed development plan. Each iteration = one spec `NNN` (spec + architecture + plan
with a **test plan written before the code**) = one `feat/` branch = one PR passing CI.
See the `snapfinity-feature` skill for the gate-driven workflow.

## Guiding principles

1. **Test harness + CI exist before any feature** (it 0) — "tests from day one" is literal.
2. **Pure logic is isolated from WASM/DOM** — calibration, sizing, offset live in
   framework-free modules (trivially unit-testable); WASM (opencv.js, replicad, three.js)
   sits behind thin adapters with deterministic I/O.
3. **Tracer bullet**: traverse the whole pipeline early with a *synthetic* polygon, then
   replace the stub with real vision. Vision (the riskiest, least dry-testable part) comes
   last among the big pieces, so its output drops into an already-proven downstream.

## Test pyramid

| Level                | What                       | Example automatic assertion                              |
| -------------------- | -------------------------- | -------------------------------------------------------- |
| Unit (many, fast)    | pure logic                 | `mmPerPx(500px, OD 76.2)` ≈ expected; `sizeUnits(130mm,42)=4` |
| Geometry / golden    | generated mesh             | STL bbox ≈ `L·pitch × P·pitch × (N·7+base)` ± tol; volume>0; manifold |
| Vision-metric (dataset) | mask vs ground truth    | **IoU ≥ threshold** per photo; calibration error < X %; "no token → refuse" |
| E2E / integration    | full pipeline              | 1 photo → valid STL with plausible dimensions            |
| Manual / visual      | 3D render, UX              | minimal, explicitly labelled in the plan                 |

The dataset (`docs/technical/dataset.md`) is the fixtures set: each photo + mask is a
measurable test case (IoU), not an eyeball check.

## Iterations

| #   | Iteration                                | Deliverable                                                  | Key tests                                          | Role |
| --- | ---------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- | ---- |
| 0   | Scaffold + harness + CI                  | Vite, Vitest, ESLint, GitHub Actions (build+test+lint green) | one passing sample test proving CI                 | "tests from day 1" base |
| 1   | Calibration & sizing math (pure)         | px→mm; `ceil(dim/pitch)`; height N×7; pitch 42/36            | rich units: nominal, boundaries (42.0 vs 42.01), pitch 36, zero/huge | fully-tested foundation |
| 2   | replicad CAD spike: parametric bin       | baked foot 42 → tile L×P → walls → lip → STL (no pocket)     | bbox/volume/manifold on 1×1, 2×1, 3×2              | **de-risk WASM CAD** |
| 3   | Pocket subtraction                       | synthetic polygon → hollowed bin                             | pocket bbox ≈ polygon; volume drops; depth correct | CAD end-to-end |
| 4   | 3D preview (three.js) + export STL/STEP/3MF | viewer + download buttons                                 | export integrity (STL header, triangles>0); DOM wiring | **first visible demo** |
| 5   | Offset (clipper)                         | polygon + offset mm → expanded polygon                       | compare to the Python oracle on same inputs        | clearance link |
| 6   | Token detection + calibration (opencv.js)| fiducial: RETR_TREE + circularity + 6 holes + threshold      | on dataset: token found, scale ± tol, **refuse if absent** | vision part 1 |
| 7   | Object segmentation (ML matting vs adaptive CV) | silhouette → contour                                  | **IoU vs ground truth** across dataset; regression guard | vision part 2 (hardest) |
| 8   | End-to-end wiring + UX                   | photo→bin→preview→export; params (pitch, base variant, height, offset) | integration: 1 photo→valid STL; manual UX | coherent product |
| 9+  | Base variants, free pitch, mobile, deploy | …                                                           | …                                                  | polish |

## Shipped since (iteration 10 — perf pass)

| #   | Spec | Deliverable |
| --- | ---- | ----------- |
| 016 | webgpu-pocket-perf | u2netp on WebGPU (auto WASM fallback) + decimate the pocket polygon before the replicad cut |
| 017 | cad-worker | replicad build + mesh + export moved to a web worker (no UI freeze; main bundle −333 kB) |

Perf step 3 (vision worker: opencv + onnx + OffscreenCanvas decode) is **deferred** — the
only remaining freeze is the `analyzePhoto` pass; revisit if it bothers, starting with a
de-risk spike.

## Backlog — next features (prioritized)

Agreed order (each becomes its own spec `NNN` + `feat/` branch + PR, via the
`snapfinity-feature` workflow). Effort: XS < S < M < L; R&D = needs scoping first.

| #   | Feature | Zone | Effort | Notes / key tests |
| --- | ------- | ---- | ------ | ----------------- |
| 1 | **3D render transparency** | preview (three.js) | XS | `material.transparent + opacity` + an opacity slider on the Preview tab — see inside the pocket. Manual visual. |
| 2 | **Printable 1:1 top-view PDF** | new export | M | Footprint (mm) → exact PDF points; **multi-A4 tiling** for large objects; registration marks + a control ruler. Pure mm→pt + page-layout core is unit-tested. Must tell the user to print at 100 % (disable "fit to page"). Lets the user validate the outline before printing the bin. |
| 3 | **Side grip notch (scoop)** | CAD (replicad) | L | Gridfinity-style scoop/finger cutout on a wall; parametric (side, depth); interacts with pocket + lip. Tested via bin dims/volume. |
| 4 | **Detect & straighten "straight" contour runs** | contour (core) | M | Detect near-rectilinear segments and, **optionally**, rectify them (angle-snap?). Builds on `simplify`/`smoothContour`. Pure, unit-tested. Great for manufactured objects. |
| 5 | **Logo / favicon + site publication** | asset + infra/CI | S + M | SVG logo/favicon (iterate on taste), then deploy to GitHub/Cloudflare Pages: Vite `base`, SPA routing, ~35 MB WASM payload, caching (no COOP/COEP — `numThreads=1`). Makes it usable by others. |
| 6 | **Revisit the calibration token?** | vision/calib + physical | R&D | Exploratory: more robust fiducial? different size? ArUco/AprilTag? **Decide before any spec.** Not urgent while detection holds. |

## Contour extraction (next iteration)

Bridges segmentation (it 8a, spec 012) → pocket (it 3 CAD). The mask is binary at pixel
resolution, so its raw contour is jagged → a pixelated pocket. And on hard cases (chrome on
white, etc.) the auto mask is simply wrong. This iteration makes the **mask the editable
layer** and derives a clean, **user-tunable** contour from it — all live:

```
auto mask ──(brush add/erase)──▶ corrected mask ──(smoothing)──▶ contour ──(clearance)──▶ offset contour
                                          └────────────── overlay redraws in real time ─────────────┘
```

- **Smoothing / tolerance slider** — less pixelation, rounder corners. Likely mask
  blur + re-threshold and/or `approxPolyDP` + chaikin/spline resample; one knob from
  "faithful" to "smooth".
- **Clearance slider** — the offset already decided (default 1.0 mm).
- **Brush paint / erase** (→ **014**) — let the user **correct the mask** directly: fill zones
  the model missed (the chrome-fork failure), erase stray blobs the cleanup kept. Turns the
  tool from auto-only into auto + manual fix — the key to usability on real photos. Paint on
  the binary mask at full res; the contour re-derives from the edited mask.
- **Live visual feedback** — the contour overlay on the photo redraws in **real time** as the
  sliders move (and, in 014, as the user paints), *before* generating the 3D pocket. The core
  UX: an interactive visual adjuster, not a one-shot pipeline.
- Scope target: **white/light background** (decisions #11); the brush (014) is what rescues
  the non-white / glossy cases.

**Split (decisions #14):** 013 = outer contour + smoothing + clearance + live 2D overlay
(spec 013). 014 = mask brush. Then the offset contour feeds the 3D pocket (014/015). Outer
contour only for now (decisions #13). Later: the **left panel becomes tab-contextual**
(Outline → contour tools, 3D → bin params).

## Notes

- UI framework is decided at **it 4** (the scaffold in it 0 stays framework-agnostic).
- The dataset grows **in parallel** with it 2–5 (CAD work), so vision (it 6–7) starts with
  a richer corpus.
- Ground-truth masks (`dataset/truth/`) are produced in time for it 7.
