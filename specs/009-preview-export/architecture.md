# Architecture — 009 live preview + export

## Pipeline stage(s) touched

Preview + export — the bin now renders live and downloads.

## Modules

- `src/cad/oc-browser.ts` — browser OpenCascade init: `opencascade({ locateFile: () => wasmUrl })`
  with the wasm imported via Vite `?url`. No `__dirname` shim (browser branch). Idempotent.
- `src/cad/mesh.ts` — `shapeToGeometry(shape, tol)` → three.js `BufferGeometry`
  (`shape.mesh()` → position/normal attributes + index).
- `src/cad/export.ts` — adds `shapeToStep` (`blobSTEP`), `binFilename`, `downloadBlob`.
- `src/features/workspace/useBin.ts` — hook: init OC → `makeBin(params)` → geometry; debounced
  (250 ms) on size/height/pitch/lip; returns `{ geometry, shape, status }`.
- `src/features/workspace/Viewer.tsx` — React Three Fiber `<Canvas>` + `<OrbitControls>`,
  the bin mesh (rotated Z-up → Y-up), soft lights, loading/error overlay.
- `Workspace` wires `useBin` → `Viewer` + an `onExport(format)` to `Header` (STL / STEP buttons).

## Notes / follow-ups

- v1 runs CAD on the **main thread** (debounced). Move to a **Web Worker** later (no UI jank).
- Bundle is large (~1.4 MB JS: replicad + three) — **code-split** the CAD/viewer with dynamic
  import to speed first paint.
- The preview shows the **plain bin**; the tool **pocket** (thickness/offset) needs a real
  footprint from detection (it 6/7).

## Tests

`binFilename` (pure), `shapeToStep` + `shapeToGeometry` (node OC). The WebGL render is
validated by a headless Chrome screenshot (swiftshader), not a unit test.
