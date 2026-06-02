# Architecture

Target architecture for Snapfinity. This document records the **decisions** taken and
the **reasons**, so they don't have to be re-litigated. Feature specs build on top.

## 1. Goal

From a single **phone photo** of a tool (placed next to a calibration token), produce a
**custom Gridfinity bin** whose pocket matches the tool's silhouette, exportable as
STL/STEP/3MF for 3D printing. The product must be **convivial** and **shareable with the
community**.

## 2. The core decision: 100 % in-browser (WASM), no backend

The whole pipeline runs **client-side**. There is no server.

| Criterion              | Python backend          | **All-browser (WASM) — chosen** |
| ---------------------- | ----------------------- | ------------------------------- |
| Hosting                | server to pay & maintain | **free static site**           |
| Scaling                | per-request compute      | **infinite (runs on the device)** |
| Privacy                | photo uploaded           | **photo never leaves the phone** |
| Reuse of Python script | direct                   | re-port vision to JS            |
| Ready-made Gridfinity  | `cqgridfinity`           | modelled in replicad (proven in the it 2 spike) |
| Upfront work           | low                      | higher                          |

**Rationale.** For a free, community tool, ongoing hosting/maintenance is what kills the
project over time. A static site never dies, scales for free, and keeps the photo on the
device. We accept the higher upfront porting cost in exchange.

The original Python script is **not** thrown away — it becomes the **algorithm oracle**
(see [algorithm-bench.md](algorithm-bench.md)): the fast environment to tune and validate
detection on real photos. The product is built **once**, in WASM.

## 3. Pipeline

```
📱 photo (tool + token)
  → opencv.js     detect token → calibrate mm/px → extract tool contour
    → clipper      offset the contour (printing clearance)
      → replicad   build the parametric Gridfinity foot, tile L×P → walls (N×7mm)
                   → + stacking lip → − tool pocket
        → three.js live 3D preview
          → export STL / STEP / 3MF
```

## 4. Component choices

| Concern         | Choice          | Why                                                         |
| --------------- | --------------- | ----------------------------------------------------------- |
| Vision          | **opencv.js**   | WASM port of OpenCV; has threshold, findContours, HoughCircles, morphology, matchShapes |
| Polygon offset  | **clipper (js)**| The Clipper lib `pyclipper` already wraps exists in JS      |
| CAD kernel      | **replicad**    | OpenCascade via WASM; clean booleans, extrude, STEP/STL export |
| Gridfinity geometry | **modelled in replicad** | Parametric foot/lip — no Python, no STEP assets (decided in the it 2 spike) |
| 3D preview      | **three.js**    | Standard interactive 3D in the browser                      |
| Build / hosting | **Vite** + static Pages | Zero-infra distribution                              |

## 5. Gridfinity geometry strategy

### Sizing rules

- **Footprint** snaps to the grid: a bin is **L × P units**, with
  `L = ceil(width / pitch)`, `P = ceil(depth / pitch)`.
- **Height** is in **7 mm** increments (+ the ~5 mm base height).
- **Pitch**: continuous parameter, validated to **20–84 mm** (42 standard, 36 common).
  ⚠️ Different pitches are **not cross-compatible** — a bin fits a baseplate of the *same*
  pitch only. The UI must say so.
- **Base variants**: magnet / screw / plain. At smaller pitch the magnet (6.5 mm) fits
  worse → the available base variants depend on the pitch (UI greys out impossible ones).

### Parametric foot, modelled in replicad

The it 2 spike proved replicad can build correct geometry headless, so we model the foot
**directly in replicad** rather than pre-baking it in Python — no Python dependency, no
STEP assets, everything stays JS for the all-browser target.

```
Browser (replicad):  build foot(pitch) → tile L×P → walls(N×7) → +lip → −pocket → export
```

The bin is built parametrically from `cols/rows/heightUnits/pitch/includeLip`. The **real
Gridfinity foot (socket) + stacking lip** are adapted from replicad's MIT Gridfinity
example, parametrised by pitch (20–84 mm), **without magnets/screws** (by design). The
socket/lip profiles are pitch-independent; only the footprint scales. See `src/cad/bin.ts`
and spec 004. (Open: exact-spec fit on real baseplates — replicad's socket is 5.0 mm vs
standard 4.75 — needs a physical fit test.)

What scales with pitch and what doesn't:

| Element                              | Behaviour with pitch                 |
| ------------------------------------ | ------------------------------------ |
| Foot footprint (rounded square)      | scales (≈ pitch − clearance)         |
| Vertical stacking profile (chamfers) | **constant** (the stacking interface) |
| Magnet / screw positions             | tighten → constrain base variant     |
| Auto-sizing L×P                      | `ceil(dim / pitch)`                  |

## 6. Token detection (smarter than the oracle's first version)

The token is effectively a **home-made fiducial marker**: a disc of known OD with a
6-fold star of through-holes. The first Python version used `RETR_EXTERNAL` + a
thresholdless `matchShapes` (fragile: a round tool can be mistaken for the token).

Target detection uses the **topological signature** now known from the token's STEP:

```
token = a contour that is, all at once:
  1. near-circular            (circularity 4πA/P² ≈ 1)
  2. of consistent diameter   (coherent with OD 76.2 mm)
  3. contains ~6 child holes  (RETR_TREE, not RETR_EXTERNAL)
  4. holes in 6-fold symmetry
→ all above a confidence threshold ⇒ calibrate; else warn instead of mis-calibrating
```

Calibration ground truth: nominal OD = **76.2 mm** (radius 38.1 from the STEP). For
accuracy, prefer a **caliper-measured** OD of the *printed* token (print shrink ~0.2–0.5 %).

## 7. Repository layout (target)

```
Snapfinity/
├── CLAUDE.md                 # AI entry point
├── README.md
├── docs/
│   ├── specs-index.md
│   └── technical/
│       ├── architecture.md   # this file
│       └── algorithm-bench.md
├── specs/NNN-name/           # per-feature: spec.md + architecture.md + plan.md
├── .claude/skills/           # gate-driven workflows (snapfinity-feature, …)
├── src/
│   ├── core/                 # pure logic (calibration, sizing) — unit-tested
│   ├── cad/                  # replicad models (bin) + headless OC init for tests
│   └── main.ts               # app entry (UI from it 4)
├── tools/cad/                # dev tooling (sample STL generator)
├── out/                      # generated CAD artifacts (gitignored)
└── index.html
```

## 8. Open questions / later

- Exact Gridfinity profile (precise chamfer stack, magnet/screw holes) + real-baseplate fit — a profile-refinement iteration after the spike.
- Arbitrary pitch (beyond 42/36) — the foot is already parametric in pitch, so mostly UI surface.
- UI framework (vanilla vs React/Svelte) — decided in the first UI spec.
- License — **GPL-3.0** (copyleft, consistent with Sowel's AGPL line). See `LICENSE`.
- WASM payload (opencv.js + replicad ≈ 20 MB) and mobile perf → lazy-load, cache, minimal runtime compute.

## 9. In-browser vision (spec 012)

The vision pipeline runs **client-side**, as designed: opencv.js (token) + **onnxruntime-web**
(u2netp) are dynamically imported on the first photo (a separate `analyze-*` chunk, off the
first-paint path). The u2netp model lives in `public/models/`, and ort's WASM runtime is
served **flat at `/ort/`** (copied by `vite-plugin-static-copy`, `wasmPaths` pointed there) so
everything works **offline** with no CDN. Inference is single-threaded (`numThreads = 1`) to
avoid needing cross-origin isolation (COOP/COEP) on static hosts. The mask cleanup
(`src/vision/isolate.ts`) is **shared** with the Node `verify:seg` script — one implementation,
two callers. Pure helpers (`maskBBox`, `footprintFromBBox`) stay cv-free and unit-tested.

Inference runs on **WebGPU when available, falling back to WASM** (spec 016): the provider
list is `['webgpu','wasm']` if `navigator.gpu` exists, else `['wasm']` — WebGPU runs the
conv-heavy u2netp several× faster, with no regression where it's absent.

## 10. CAD in a web worker (spec 017)

replicad's build + meshing + STL/STEP export run in a **dedicated module worker**
(`src/cad/cad.worker.ts`), not on the main thread — so a rebuild on the Preview tab never
freezes the UI (the 3D view keeps orbiting, the spinner really spins) and export no longer
blocks. The `Shape3D` is a live OpenCascade WASM handle bound to the worker's OC instance, so
it **cannot cross the thread boundary**: the worker keeps it, returns a **transferable mesh**
(`positions`/`normals`/`index` typed arrays → `arraysToGeometry` on the main thread), and is
also the only place that can **export** it (hence export is async). A small `cad-client.ts`
owns the worker and routes replies by request `id`. Because the client's replicad imports are
**type-only**, replicad's ~11 MB WASM leaves the main bundle entirely. The build is still
gated to the Preview tab and debounced (`useBin`).
