# Architecture — 017 replicad CAD in a web worker

## Pipeline stage touched

Only the **CAD** stage (replicad) + its meshing/export. Vision, offset, contour are
unchanged. The change is about **where** the CAD runs (worker), not **what** it computes.

```
main thread                          worker thread (cad.worker.ts)
-----------                          -----------------------------
useBin ──build(params, footprint)──▶ initOcForBrowser() [once]
                                     makeBin / makeBinWithPocket → Shape3D  (kept)
       ◀──{positions,normals,index}─ meshToArrays(shape)            (transfer)
arraysToGeometry → BufferGeometry
   → three.js preview

exportBin(format) ─────────────────▶ shapeToStl/Step(currentShape)
       ◀──────────────────── Blob ── (structured clone)
downloadBlob(blob)
```

## Why the shape must stay in the worker

`Shape3D` is a live OpenCascade WASM handle bound to the **worker's** OC instance. It cannot
cross the thread boundary (not structured-cloneable, not transferable). So the worker keeps
`currentShape` and is the only place that can mesh it **or** export it — hence export moves
to the worker and becomes async.

## Message protocol (`cad-messages.ts`)

Request/response keyed by an incrementing `id`:

```
// main → worker
{ type: 'build',  id, binParams, footprint: Point2D[] | null, depthMm }
{ type: 'export', id, format: 'stl' | 'step' }

// worker → main
{ type: 'built',    id, positions: Float32Array, normals: Float32Array, index: Uint32Array }
{ type: 'exported', id, blob: Blob }
{ type: 'error',    id, message: string }
```

`built` transfers the three array buffers (zero-copy). `exported` clones the `Blob` (cheap;
the buffer stays in the worker otherwise).

## Worker client (`cad-client.ts`)

A lazy singleton that owns the `Worker` and a `Map<id, {resolve, reject}>`:

```
new Worker(new URL('./cad.worker.ts', import.meta.url), { type: 'module' })
buildBin(binParams, footprint, depthMm): Promise<MeshArrays>
exportBin(format): Promise<Blob>
```

On each worker message it looks up the pending entry by `id` and settles it. The client does
not itself decide staleness — `useBin` ignores a resolved build from a cancelled effect.

## `useBin` (rewired)

Same shape of hook, same debounce / signature guard / `enabled` (Preview-tab) gating. The
build effect now does:

```
const mesh = await client.buildBin(binParams, footprint, depthMm)  // worker, non-blocking
if (!cancelled) setResult({ geometry: arraysToGeometry(mesh), status: 'ready' })
```

Returns `{ geometry, status, exportBin }` where `exportBin(format)` proxies to the client.
**No more `shape` on the main thread.**

## `Workspace` (export becomes async)

```
const exportFile = async (format) => {
  const blob = await exportBin(format)
  if (blob) downloadBlob(blob, binFilename(params.cols, params.rows, format))
}
```

`canExport` stays `status === 'ready'`.

## Mesh helpers split

| Function | Module | Side | Deps |
| -------- | ------ | ---- | ---- |
| `meshToArrays(shape)` | `cad/mesh-arrays.ts` (new) | worker | replicad only |
| `arraysToGeometry(mesh)` | `cad/mesh.ts` (+) | main | three only |
| `shapeToGeometry(shape)` | `cad/mesh.ts` (kept) | tests | three + replicad |

Splitting keeps the worker free of three.js and keeps `arraysToGeometry` unit-testable
without WASM.

## Files added / changed

| File | Change |
| ---- | ------ |
| `src/cad/cad-messages.ts` | **new** — shared request/response types |
| `src/cad/cad.worker.ts` | **new** — OC init + build + mesh + export, holds `currentShape` |
| `src/cad/cad-client.ts` | **new** — Worker singleton + id-keyed promise routing |
| `src/cad/mesh-arrays.ts` | **new** — `meshToArrays` (replicad-only) |
| `src/cad/mesh-arrays.test.ts` | **new** — Node OC test |
| `src/cad/mesh.ts` | **+** `arraysToGeometry` |
| `src/cad/mesh.test.ts` | **+** `arraysToGeometry` case |
| `src/features/workspace/useBin.ts` | rewired to the worker client; returns `exportBin` |
| `src/features/workspace/Workspace.tsx` | async `exportFile`; drop `shape` |
| `docs/technical/architecture.md` | note the CAD-in-worker decision (§9 sibling) |
| `docs/specs-index.md` | add row 017 |

## Risks

- **Worker bundling under Vite** — de-risked by the spike (replicad builds + meshes in the
  worker). The production `build` re-confirms it.
- **Transfer correctness** — the mesh arrays must be detached after transfer; the worker
  builds fresh arrays each time so there's no reuse-after-transfer bug.
- **Async export race** (export while a rebuild changes the shape) — minor; export captures
  the worker's current shape at message-processing time, which is the user's intent (the
  shape on screen). Acceptable.
