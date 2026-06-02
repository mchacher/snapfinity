# Plan — 016 WebGPU + pocket simplification

## Implementation steps (dependency order)

1. **Pure logic / types**
   - [x] `src/vision/providers.ts` — `pickExecutionProviders(hasWebGpu)` (cv/ort-free).
   - [x] `src/core/footprint.ts` — `POCKET_SIMPLIFY_MM = 0.2` + `simplifyFootprintMm()`
     (reuses `simplify` from `core/contour.ts`; < 3-pt guard).

2. **WASM adapters**
   - [x] `src/vision/seg-runtime.ts` — import `onnxruntime-web/webgpu`; build the session
     with `executionProviders: pickExecutionProviders('gpu' in navigator)`. Keep
     `wasmPaths = /ort/` and `numThreads = 1`.
   - [x] `src/cad/pocket.ts` — call `simplifyFootprintMm(footprint)` before drawing the
     sketch.

3. **Tests** (see test plan)
   - [x] `src/vision/providers.test.ts`
   - [x] extend `src/core/footprint.test.ts`
   - [x] `src/cad/pocket.test.ts` still green + dense-ring dims test (retro-compat)

4. **Docs**
   - [x] `docs/specs-index.md` — add row 016.
   - [x] check off acceptance criteria / tasks.

No UI, no new assets.

## Test plan

| Module | Scenario | Type |
| ------ | -------- | ---- |
| `vision/providers.ts` | `hasWebGpu=true → ['webgpu','wasm']` | unit |
| | `hasWebGpu=false → ['wasm']` | unit |
| `core/footprint.ts` `simplifyFootprintMm` | dense near-collinear edge collapses to its endpoints | unit |
| | a square's 4 corners are preserved | unit |
| | bbox preserved within `POCKET_SIMPLIFY_MM` | unit |
| | < 3 points returned unchanged | unit |
| `cad/pocket.ts` | outer bin dims preserved with a dense (≈200-pt) ring | unit (replicad) |
| | existing pocket tests still pass | unit (replicad) — retro-compat |
| `vision/seg-runtime.ts` (WebGPU) | same silhouette as WASM on `ciseaux.jpg`; WASM fallback works | **manual visual** |

**Why manual for the WebGPU path.** It needs a real browser + GPU adapter + the
onnxruntime WASM/WebGPU runtime — not assertable cheaply in Node/Vitest. The *logic* that
selects providers is extracted to `providers.ts` and unit-tested; the *runtime* is
verified by a manual visual check (segmentation still produces the correct mask, and a
WebGPU-less browser still falls back). The user performs this visual check.

## Validation (Gate 4)

```
npm run build      # ZERO errors — also proves the onnxruntime-web/webgpu bundle resolves
npm test           # all pass
npm run lint       # clean
npm run typecheck  # clean
```

Manual: load a real photo in `npm run dev`, confirm the silhouette is unchanged and the
3D rebuild on a complex shape is faster.
