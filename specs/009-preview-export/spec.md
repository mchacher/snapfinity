# Spec 009 — Live 3D preview + export

## Overview

Iteration 4 (part 2). Replace the viewer placeholder with a **live three.js preview** of the
bin, driven by the controls, and add **STL / STEP export** (browser download). Makes the app
usable end-to-end with manual parameters. (Real photo detection feeds the size later — it 6/7.)

## Goals

- Initialise **replicad in the browser** (OpenCascade wasm via Vite `?url`).
- Build the bin from the controls (`makeBin` / `makeBinWithPocket`) and render it in
  **React Three Fiber** with orbit/zoom, soft lighting, a ground/grid hint.
- Regenerate on parameter change (debounced) with a small "generating" state.
- **Export**: STL (binary, default tolerance) and STEP, downloaded in the browser.

## Non-goals

- Real photo detection / segmentation (it 6/7) — the pocket uses a placeholder footprint for now.
- Web-worker offloading (v1 runs CAD on the main thread, debounced) — a later optimisation.
- 3MF (replicad exports STL/STEP natively; 3MF later if needed).

## Requirements

- **R1** — Browser OC init (separate from the node init); replicad builds shapes client-side.
- **R2** — `shape.mesh({ tolerance })` → three.js `BufferGeometry` (vertices/normals/triangles).
- **R3** — Viewer renders the bin, updates on param change (debounced ~300 ms), shows a loading state.
- **R4** — Export STL + STEP as a downloaded file; filename reflects size (e.g. `snapfinity-2x1.stl`).
- **R5** — Pure logic (mesh-from-shape mapping, filename, export blob) is unit-tested; the render is screenshot-validated.

## Acceptance criteria

- [x] Browser OC init + R3F viewer renders the live bin (orbit/zoom)
- [x] Controls drive the preview (pitch/size/height/lip; thickness/offset apply to the pocket — it 6/7)
- [x] STL + STEP download wired; `binFilename`, `shapeToStep`, `shapeToGeometry` tested
- [x] `npm run typecheck | lint | test | build` green (43 tests); CI green on the PR pending
- [x] Screenshot of the rendered bin (self-validated via headless WebGL); user visual OK later

## Edge cases

- OC init is async + once; show loading until ready.
- Invalid param combos clamped (min sizes) before building.
- Heavy generation: debounce; never block the first paint (lazy-init OC).
