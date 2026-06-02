# Architecture — 016 WebGPU + pocket simplification

## Pipeline stages touched

```
📱 photo
  → opencv.js (token)
  → onnxruntime-web (u2netp)        ← R1: WebGPU EP, WASM fallback
    → clipper (offset)
      → replicad (pocket cut)        ← R2: decimate footprint before the boolean
        → three.js preview
          → export
```

Two independent stages; no data-shape changes flow between them.

## R1 — WebGPU inference

**Import.** `seg-runtime.ts` switches `import * as ort from 'onnxruntime-web'` →
`'onnxruntime-web/webgpu'`. The `./webgpu` subpath (onnxruntime-web 1.26) bundles the
WebGPU execution provider on top of the same JSEP WASM core and ships the same type
declarations. `vite-plugin-static-copy` already copies **all** `dist/*.{wasm,mjs}` to
`/ort/` (including `ort-wasm-simd-threaded.jsep.wasm`), so WebGPU's JSEP glue is already
served offline — **no vite change**.

**Provider selection (pure).** New `src/vision/providers.ts`:

```
pickExecutionProviders(hasWebGpu: boolean): ('webgpu' | 'wasm')[]
  hasWebGpu  → ['webgpu', 'wasm']
  !hasWebGpu → ['wasm']
```

cv/ort-free → unit-testable in Node (no heavy import). `seg-runtime.ts` calls it with
`typeof navigator !== 'undefined' && 'gpu' in navigator` and passes the result as
`InferenceSession.create(url, { executionProviders })`.

**Why ordered fallback.** onnxruntime walks the provider list and uses the first that
initialises. `['webgpu', 'wasm']` means: WebGPU when an adapter is available, else CPU
WASM — covers Safari/Firefox and headless/no-GPU environments with no extra code.

**Output.** Still a CPU `Float32Array` (default output location); the mask post-processing
(`isolate.ts`) is unchanged.

## R2 — Pocket footprint decimation

**Helper (pure).** `src/core/footprint.ts` gains:

```
POCKET_SIMPLIFY_MM = 0.2                       // < a 0.4 mm nozzle → print-invisible
simplifyFootprintMm(footprint: Point2D[]): Point2D[]
  = simplify(footprint, POCKET_SIMPLIFY_MM)    // Douglas–Peucker (core/contour)
    with a < 3-point guard (returns the original ring)
```

Reuses the existing `simplify` from `core/contour.ts` (already unit-tested). Douglas–
Peucker on the ring as an open polyline keeps the first/last vertices; `pocket.ts` closes
the ring with `.close()` exactly as before.

**Call site.** `cad/pocket.ts` `makeBinWithPocket` decimates the footprint right before
building the sketch:

```
const ring = simplifyFootprintMm(footprint);   // ← before draw(ring[0])…lineTo…close
```

This is literally "simplify the polygon before the CAD cut". Fewer `lineTo` edges → a
cheaper boolean `cut`. The outer bin and pocket shape are unchanged within 0.2 mm.

**Why in `pocket.ts`, not `Workspace.tsx`.** Keeping it at the CAD boundary localises the
perf concern, leaves the on-screen overlay at full fidelity (it draws the px
`offsetContour`, untouched), and leaves the auto-size bbox computed from the full
footprint (DP preserves extreme points, so the bbox is preserved either way).

## Data shapes

| Where | Before | After |
| ----- | ------ | ----- |
| `runSaliency` in/out | `Uint8ClampedArray` → `Float32Array` | unchanged |
| pocket `footprint` | `Point2D[]` (≈100s of pts) | `Point2D[]` (≈10s of pts), same ring |

## Files added / changed

| File | Change |
| ---- | ------ |
| `src/vision/providers.ts` | **new** — pure `pickExecutionProviders` |
| `src/vision/providers.test.ts` | **new** — unit test |
| `src/vision/seg-runtime.ts` | WebGPU import + provider selection |
| `src/core/footprint.ts` | **+** `POCKET_SIMPLIFY_MM`, `simplifyFootprintMm` |
| `src/core/footprint.test.ts` | **+** decimation cases |
| `src/cad/pocket.ts` | decimate footprint before the cut |
| `docs/specs-index.md` | add row 016 |

## Risks

- **WebGPU numerical drift** vs WASM — same model, conv ops; silhouette differences are
  sub-pixel after thresholding. Mitigation: manual visual check; WASM path unchanged.
- **Over-decimation** distorting tight features — mitigated by the 0.2 mm tolerance
  (< nozzle) and a unit test asserting corners/bbox are preserved.
- **`onnxruntime-web/webgpu` bundle resolution under Vite** with `optimizeDeps.exclude` —
  verified by the production `build`.
