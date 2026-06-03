# CLAUDE.md

Guidance for Claude Code (and any AI agent) working on **Snapfinity**. This is the
**first file to read** when starting a session. It is intentionally short — deep
context lives in `docs/` and `specs/`.

## Where to find context

| You want to know...                                  | Read this                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| What Snapfinity is and how it's architected          | [docs/technical/architecture.md](docs/technical/architecture.md)      |
| The vision algorithm reference (the "oracle")        | [docs/technical/algorithm-bench.md](docs/technical/algorithm-bench.md) |
| The photo bank for robust segmentation               | [docs/technical/dataset.md](docs/technical/dataset.md)                |
| The incremental development plan (iterations)        | [docs/roadmap.md](docs/roadmap.md)                                    |
| All features ever shipped, by spec                   | [docs/specs-index.md](docs/specs-index.md)                            |
| Specific feature history / design                    | `specs/NNN-name/{spec,architecture,plan}.md`                          |
| Where/how to host & deploy (and the Cloudflare gotcha) | [docs/technical/hosting.md](docs/technical/hosting.md)               |

## Project in one paragraph

Snapfinity turns a **phone photo of a tool** into a **custom Gridfinity bin** with a
pocket shaped exactly like the tool, ready to 3D-print. A calibration **token** of
known size placed in the photo gives the scale; computer vision extracts the tool's
outline, an offset adds clearance, and a parametric Gridfinity base is hollowed to
that shape. Everything runs **100 % in the browser** — no backend: the photo never
leaves the device, hosting is a free static site, and it scales infinitely.

## Pipeline in one diagram

```
📱 photo (tool + token)
  → opencv.js     detect token → calibrate mm/px → extract tool contour
    → clipper      offset the contour (printing clearance)
      → replicad   build the parametric Gridfinity foot, tile L×P → walls (N×7mm)
                   → + stacking lip → − tool pocket
        → three.js live 3D preview
          → export STL / STEP / 3MF
```

## Tech stack

- **Frontend**: Vite + light JS (framework TBD in first UI spec)
- **Vision**: opencv.js (OpenCASCADE-free WASM port of OpenCV)
- **Polygon offset**: clipper (js port of the Clipper lib used by `pyclipper`)
- **CAD**: replicad (OpenCascade WASM) — parametric Gridfinity bin (real foot + lip adapted
  from replicad's example, **pitch 20–84 mm**, no magnets) + boolean pocket. No Python, no STEP assets.
- **3D preview**: three.js
- **Hosting**: static site (GitHub Pages / Cloudflare Pages)

## Key domain concepts

| Term          | Role                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------- |
| **Token**     | Calibration reference of known diameter. `token 2.0 v4`: OD **76.2 mm**, 2 mm thick, 6-fold star.  |
| **Footprint** | The tool's 2D outline extracted from the photo, plus a clearance **offset**.                       |
| **Pitch**     | Gridfinity grid spacing, parametric **20–84 mm** (42 standard). Pitches are NOT cross-compatible. |
| **Foot**      | The pitch×pitch Gridfinity base unit — modelled parametrically in replicad, tiled L×P.              |
| **Bin**       | The generated box: tiled feet + walls (N×7 mm) + stacking lip − tool pocket.                        |

## Conventions

- **Specs-first, gate-driven** workflow — use the `snapfinity-feature` skill. Never
  skip a gate, never start coding without an approved spec.
- **One feature = one `feat/` branch = one spec = one PR.** Never commit to `master`.
- **English** in code, specs, and docs. UI copy language TBD in the first UI spec.
- The original Python script (`100_Gridfinity/GridfinityFootprintGenerator/`) is the
  **algorithm oracle / tuning bench**, NOT part of the product. Keep it intact; use it
  to validate detection on real photos before/while porting to opencv.js. See
  [algorithm-bench.md](docs/technical/algorithm-bench.md).

## Build & run

```bash
npm install        # install dev deps (Node 20+)
npm run dev        # Vite dev server
npm run build      # production build → dist/
npm run preview    # preview the production build

npm run typecheck  # tsc --noEmit (strict)
npm run lint       # eslint
npm test           # vitest run (what CI runs)
npm run test:watch # vitest in watch mode
```

**Code layout.** `src/core/` holds **pure logic** (no WASM, no DOM) — fully unit-tested
(`*.test.ts` beside the source). WASM adapters (`src/adapters/` for opencv.js / replicad /
three.js / clipper) and the UI (`src/ui/`) arrive in their own iterations and stay thin
around `core/`. CI (`.github/workflows/ci.yml`) runs typecheck + lint + test + build on
every push and PR.
