# Spec 017 — replicad CAD build in a web worker (perf)

## Overview

Step 2/3 of the perf pass. The bin build (`makeBin` / `makeBinWithPocket` + meshing) and
the STL/STEP export run **synchronously on the main thread** today, so every rebuild on the
Preview tab freezes the UI for ~0.7–3 s: the 3D view stops orbiting, buttons don't respond,
and the spinner only animates thanks to a compositor hack.

Move all replicad work to a **dedicated web worker**. The worker owns the OpenCascade WASM
instance and the `Shape3D`; the main thread only sends parameters and receives a **mesh**
(transferable typed arrays) for the preview and **export blobs** on demand. The main thread
never blocks.

**De-risked.** A throwaway spike proved replicad initialises, builds, and meshes a bin
inside a Vite-bundled module worker: `ok, vertices 11454, initMs 144, buildMs 678`. Running
OC in a worker is replicad's own recommended pattern.

## Goals

- The Preview tab stays **fully interactive during a rebuild** (orbit, controls, real spinner).
- **Export no longer freezes** the UI (it runs in the worker too).
- No change to the geometry, the mesh, or the exported files.
- Side benefit: replicad's ~11 MB WASM leaves the main bundle (only the worker loads it).

## Non-goals

- Vision worker (opencv + onnx) → **spec 018**.
- Building the bin on the Outline tab (keep the Preview-tab gating; out of scope).
- 3MF export, mesh-tolerance UI, or any new CAD parameter.
- A main-thread fallback for browsers without workers (all target browsers support module
  workers; documented, not implemented).

## Requirements

### R1 — Worker owns all replicad work

- A dedicated module worker initialises OpenCascade once (reusing `initOcForBrowser`),
  builds the shape (`makeBin` / `makeBinWithPocket`, depth = tool thickness), keeps the
  current `Shape3D`, and meshes it.
- The main thread receives the mesh as **raw typed arrays** (`positions`, `normals` as
  `Float32Array`, `index` as `Uint32Array`), transferred (zero-copy) — and rebuilds a
  three.js `BufferGeometry` from them.

### R2 — Export via the worker

- STL/STEP export is requested from the worker, which calls `shapeToStl` / `shapeToStep` on
  the **stored** shape and returns the `Blob`. Export is therefore **asynchronous** on the
  main thread.
- Exporting before any successful build is a no-op (the export button is already gated on
  `status === 'ready'`).

### R3 — Same behaviour, no regressions

- Identical bin / pocket / mesh / files vs the main-thread path.
- The existing debounce (250 ms), the signature guard, and the Preview-tab gating are kept.
- Stale builds are ignored: a request-id protocol routes each worker reply to its caller,
  and the hook drops results from a superseded/cancelled effect.

### R4 — Testable seams

- `arraysToGeometry(mesh)` (raw arrays → `BufferGeometry`, three-only) is **pure and
  unit-tested** on the main side.
- `meshToArrays(shape)` (shape → raw arrays, replicad-only) is **unit-tested** against a real
  bin via the Node OC init (like the existing mesh/pocket tests).
- The worker, the client, and the async export wiring are validated by a **manual visual
  check** in the browser (can't be cheaply asserted in Node).

## Acceptance criteria

- [ ] Changing pitch/size/height on the Preview tab rebuilds **without freezing** — the 3D
      view keeps orbiting and the spinner really spins. *(user to verify)*
- [ ] STL and STEP export still download the correct file, **without freezing**. *(user to verify)*
- [x] The previewed geometry is built via the worker end-to-end (headless runtime check:
      `built: true`, canvas present, no console errors) — same `meshToArrays` mesh as before.
- [x] Unit tests: `arraysToGeometry` + `meshToArrays`. All existing tests pass. *(83 tests)*
- [x] `build`, `lint`, `typecheck` clean. *(main chunk −333 kB: replicad moved to the worker)*

## Scope

**In:** `cad.worker.ts`, a worker client, shared message types, `mesh-arrays.ts`
(`meshToArrays`), `arraysToGeometry` in `mesh.ts`, `useBin` rewired to the worker, async
export in `Workspace`, unit tests, spec/docs.

**Out:** vision worker, Outline-tab building, new export formats/params, worker fallback.

## Edge cases

- **Rapid param changes** while a build is in flight → request-id guard + the hook's
  cancelled flag ensure only the latest mesh is shown.
- **Build error in the worker** (degenerate footprint) → `status = 'error'`, UI shows the
  existing error state; the worker stays alive for the next request.
- **Export with no current shape** → resolves to nothing; button stays gated.
- **Worker boot latency** (first build pays ~150 ms OC init) → covered by the existing
  `loading` state + BusyOverlay.
