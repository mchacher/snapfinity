# Plan — 012 browser vision

## Implementation steps (dependency order)

1. **Pure helpers + tests** (no WASM/DOM):
   - `maskBBox(mask, w, h)` in `src/vision/mask.ts`.
   - `footprintFromBBox(bboxPx, scaleMmPerPx, pitchMm)` in `src/core/sizing.ts`.
2. **Shared cleanup (cv)**: `cleanMask(mask, tokenCircle)` in `mask.ts`; refactor
   `tools/cv/segment-verify.ts` to call it. Re-run `verify:seg` → identical overlays.
3. **Browser adapters**:
   - `image-source.ts` — `File` → `{ imageData, seg320, grayMat }`.
   - `seg-runtime.ts` — lazy `onnxruntime-web` session + `runSaliency`. De-risk WASM paths
     with a throwaway in-app run before wiring UI.
4. **Orchestrator**: `analyzePhoto(file)` → `PhotoAnalysis`.
5. **UI**: `usePhotoAnalysis` hook; `PhotoOverlay` canvas; real upload in `ControlsPanel`;
   wire overlay + auto-size (when `!manualSize`) + scale/token pills in `Workspace`.
6. **Vite config**: ort-web WASM asset resolution; confirm `npm run build` chunks opencv/onnx
   lazily (not in the entry chunk).

## Task breakdown

- [x] `maskBBox` + `footprintFromBBox` + unit tests
- [x] `cleanMask` extracted (to `isolate.ts`); `segment-verify.ts` refactored; `verify:seg` unchanged
- [x] `image-source.ts` (browser decode)
- [x] `seg-runtime.ts` (onnxruntime-web) + WASM paths working in dev & build (flat `/ort/`,
      verified via `preview` + curl: `application/wasm` 200)
- [x] `analyzePhoto` orchestrator
- [x] `usePhotoAnalysis` + `PhotoOverlay` + upload + auto-size + pills
- [x] typecheck / lint / test (55) / build green — manual in-app visual check **pending user**

### Notes / follow-ups

- `cleanMask` lives in `isolate.ts` (not `mask.ts`): files imported by a Vitest test must be
  cv-free, so the pure `maskBBox` stays in `mask.ts` and the opencv.js cleanup is split out.
- `analyzePhoto` does **not** compute the footprint or take a pitch — the size is derived in
  the UI (`Workspace`) from the bbox + token radius + OD + pitch, so changing pitch/OD
  re-derives the size without re-running the vision pipeline.
- Flattening ort assets needs `rename: { stripBase: true }` in vite-plugin-static-copy v4
  (a bare glob preserves the full `node_modules/...` path).
- **Deploy-size follow-up:** ort-web's glue also makes Vite emit a duplicate ~26 MB
  `ort-*.wasm` into `dist/assets`. It's dead weight (runtime fetches `/ort/` via
  `wasmPaths`), so users never download it, but it bloats the build artifact. Suppress later.

## Test plan (written before code)

| Module | Nominal | Edge | Type |
| ------ | ------- | ---- | ---- |
| `maskBBox` | full-set rectangle → its bbox; scattered set pixels → tight bbox | all-zero mask → `null`; single pixel → 1×1 bbox | unit (vitest) |
| `footprintFromBBox` | 84 mm @ pitch 42 → 2 cols; bbox×scale rounds via `gridFootprint` | scale `null` → `null`; zero bbox → `null` | unit (vitest) |
| `cleanMask` (cv) | token region zeroed; stray blob removed; tool kept | — | **Node `verify:seg`** (shares the code; Vitest can't run cv) |
| `analyzePhoto` (cv+onnx) | white photo → token found, plausible scale, mask present, cols/rows ≥ 1 | no token → `scaleMmPerPx=null`, no auto-size | **manual in-app** + `verify:vision` 36/36 regression |
| Overlay + auto-size | mask tint + token circle drawn; cols/rows track the object | no token / no object → warning, size unchanged | **manual visual** |

**Manual/visual (explicit):** upload a white-background dataset photo (e.g. `scissors-white`,
`pen-white`) in `npm run dev` → confirm the overlay (mask tint + token circle) matches the
`verify:seg` output and cols/rows auto-update. onnxruntime-web init is proven by the photo
actually producing a mask in the browser. Node `verify:*` remain the cv/onnx regression guard.

## Out of scope (next specs)

- 013: contour extraction + smoothing & clearance sliders + **live overlay redraw**.
- 014: offset contour → 3D pocket → preview/export of the real bin.
