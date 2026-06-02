# Plan — 017 replicad CAD in a web worker

## Implementation steps (dependency order)

1. **Types / pure seams**
   - [x] `src/cad/cad-messages.ts` — request/response message types + `MeshArrays`.
   - [x] `src/cad/mesh-arrays.ts` — `meshToArrays(shape)` → `{positions, normals, index}`.
   - [x] `src/cad/mesh.ts` — add `arraysToGeometry(mesh)` (three-only).

2. **Worker + client (WASM/Worker adapters)**
   - [x] `src/cad/cad.worker.ts` — `initOcForBrowser` once; on `build` → make + mesh +
     store `currentShape` + post transferables; on `export` → blob from `currentShape`.
   - [x] `src/cad/cad-client.ts` — lazy `Worker` singleton; `buildBin` / `exportBin`
     returning promises routed by `id`.

3. **Wire-up (UI)**
   - [x] `src/features/workspace/useBin.ts` — build via the client; return
     `{ geometry, status, exportBin }`; keep debounce + guard + Preview-tab gating.
   - [x] `src/features/workspace/Workspace.tsx` — `exportFile` async via `exportBin`; drop
     `shape`.

4. **Tests**
   - [x] `src/cad/mesh.test.ts` — `arraysToGeometry` builds a geometry with the right
     attribute counts + index.
   - [x] `src/cad/mesh-arrays.test.ts` — `meshToArrays` on a real bin → non-empty
     `Float32Array` positions/normals + `Uint32Array` index, lengths consistent (positions
     multiple of 3, index multiple of 3).
   - [x] existing `bin` / `pocket` / `export` tests still green.

5. **Docs**
   - [x] `docs/technical/architecture.md` — short CAD-in-worker note.
   - [x] `docs/specs-index.md` — row 017; check off criteria/tasks.

## Test plan

| Module | Scenario | Type |
| ------ | -------- | ---- |
| `cad/mesh.ts` `arraysToGeometry` | arrays → geometry: position/normal attrs + index set, counts match | unit (three) |
| `cad/mesh-arrays.ts` `meshToArrays` | real bin → non-empty typed arrays, `positions.length % 3 === 0`, index `% 3 === 0` | unit (Node OC) |
| `cad/cad-messages.ts` | type-only — compile check | (typecheck) |
| `cad.worker.ts` + `cad-client.ts` | build off-thread; preview updates; UI stays interactive | **manual visual** |
| `Workspace` export | STL + STEP download correctly, no freeze | **manual visual** |

**Why manual for the worker.** Spawning a Vite module worker that boots the OC WASM needs a
real browser — not assertable in Node/Vitest. The de-risk spike already proved the runtime
path (`ok, 11454 verts, init 144 ms, build 678 ms`); the pure seams around it are unit-tested.
The user performs the visual check (responsiveness + export).

## Validation (Gate 4)

```
npm run build      # ZERO errors — also confirms the worker bundles & replicad leaves the main chunk
npm test           # all pass
npm run lint       # clean
npm run typecheck  # clean
```

Manual: `npm run dev`, Preview tab, change pitch/size → the cube keeps orbiting while it
rebuilds; export STL + STEP → files download without a freeze.
