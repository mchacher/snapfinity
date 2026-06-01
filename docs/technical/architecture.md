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
| Ready-made Gridfinity  | `cqgridfinity`           | re-create in replicad (mitigated, see §5) |
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
      → replicad   tile the pre-baked Gridfinity foot (L×P) → walls (N×7mm)
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
| 3D preview      | **three.js**    | Standard interactive 3D in the browser                      |
| Asset baking    | **cqgridfinity** (Python, offline) | Proven Gridfinity geometry; run once, ship results |
| Build / hosting | **Vite** + static Pages | Zero-infra distribution                              |

## 5. Gridfinity geometry strategy

### Sizing rules

- **Footprint** snaps to the grid: a bin is **L × P units**, with
  `L = ceil(width / pitch)`, `P = ceil(depth / pitch)`.
- **Height** is in **7 mm** increments (+ the ~5 mm base height).
- **Pitch**: **42 mm** (standard) and **36 mm** supported. ⚠️ Different pitches are
  **not cross-compatible** — a 36 mm bin does not fit a 42 mm baseplate. The UI must say so.
- **Base variants**: magnet / screw / plain. At smaller pitch the magnet (6.5 mm) fits
  worse → the available base variants depend on the pitch (UI greys out impossible ones).

### Pre-baked primitives, parametric assembly

We do **not** pre-bake every L×P×height×variant bin (combinatorial explosion). Instead:

> Pre-bake the **reusable primitives** — the single pitch×pitch **foot** (the tricky
> chamfered base profile) and the **stacking-lip** profile — per supported pitch. In the
> browser, replicad **assembles** them parametrically: tile the foot L×P, raise walls to
> N×7 mm, add the lip, subtract the tool pocket.

```
Assets (Python, baked once):  foot_{42,36}.step  +  lip_{42,36}.step   (× base variants)
Browser (replicad):           tile(foot, L×P) → walls(N×7) → +lip → −pocket → export
```

The hard geometry comes ready-made; size stays 100 % parametric; few assets.

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
├── assets/                   # baked Gridfinity primitives (foot/lip, per pitch)   [TBD]
├── tools/bake/               # Python scripts that bake the assets (cqgridfinity)   [TBD]
├── src/                      # the web app (Vite)                                   [TBD]
└── index.html
```

## 8. Open questions / later

- Arbitrary pitch (beyond 42/36) → parametric foot generated in replicad (vs more baked assets).
- UI framework (vanilla vs React/Svelte) — decided in the first UI spec.
- License — **GPL-3.0** (copyleft, consistent with Sowel's AGPL line). See `LICENSE`.
- WASM payload (opencv.js + replicad ≈ 20 MB) and mobile perf → lazy-load, cache, minimal runtime compute (base pre-baked).
