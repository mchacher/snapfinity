# Architecture — 012 browser vision

## Pipeline stage(s) touched

`opencv.js` (token) + `u2netp` (segmentation) — first time **in the browser**. Output stops
at a **mask + scale + auto-size** for now; contour/offset/pocket come in 013/014.

```
File ──image-source──▶ { fullImageData, seg320 RGBA, grayMat }
                              │
        ┌─────────────────────┴───────────────────────┐
        ▼ detectToken (opencv.js)        ▼ rgbaToTensor → ort(u2netp) → saliencyToMask
   { scaleMmPerPx, tokenCircle }              maskSmall(320)
        │                                          │ resize → full
        └──────────────► cleanMask(mask, tokenCircle) ◄── shared with verify:seg
                                  │  (exclude token · morph-open · largest component)
                                  ▼
                  maskBBox → footprintFromBBox(scale,pitch) → { cols, rows }
                                  ▼
              overlay canvas (photo + green mask + token circle) · auto-size UI
```

## New / changed files

| File | Role |
| ---- | ---- |
| `src/vision/image-source.ts` | **new** — browser decode: `File`/`Blob` → `{ imageData, seg320, grayMat }` via canvas/`createImageBitmap`. DOM adapter (mirrors `cv-image-node.ts`). |
| `src/vision/seg-runtime.ts` | **new** — lazy `onnxruntime-web` session from `/models/u2netp.onnx`; `runSaliency(seg320)` → `Float32Array`. |
| `src/vision/mask.ts` | **new** — `cleanMask(mask, tokenCircle)` (cv: exclude circle + morph-open + largest component) **+ pure** `maskBBox(mask,w,h)`. |
| `src/vision/analyze.ts` | **new** — `analyzePhoto(file)` orchestrator → `PhotoAnalysis`. |
| `src/core/sizing.ts` | **edit** — add pure `footprintFromBBox(bboxPx, scaleMmPerPx, pitchMm)` (wraps `pxToMm` + `gridFootprint`). |
| `tools/cv/segment-verify.ts` | **edit** — use shared `cleanMask` (delete inline copy; behaviour unchanged). |
| `src/features/workspace/usePhotoAnalysis.ts` | **new** — hook: file → `analyzePhoto`, status, result. |
| `src/features/workspace/PhotoOverlay.tsx` | **new** — canvas overlay (photo + mask tint + token circle + bbox). |
| `src/features/workspace/ControlsPanel.tsx` / `Workspace.tsx` | **edit** — real upload, wire overlay + auto-size + pills. |
| `vite.config.ts` | **edit** — ensure ort-web WASM assets resolve (wasmPaths / `optimizeDeps` exclude). |
| `package.json` | **edit** — add `onnxruntime-web`. |

## Data shapes

```ts
interface TokenCircle { centerPx: { x: number; y: number }; radiusPx: number }

interface PhotoAnalysis {
  scaleMmPerPx: number | null;      // null when no token
  token: { found: boolean } & Partial<TokenCircle>;
  mask: { data: Uint8Array; width: number; height: number };  // full-res 0/255
  objectBBoxPx: { x: number; y: number; w: number; h: number } | null;
  footprint: { cols: number; rows: number } | null;           // null when no scale/object
}
```

## Key decisions / risks

- **onnxruntime-web under Vite** is the integration risk: its `.wasm`/`.mjs` runtime files
  must be served. Set `ort.env.wasm.wasmPaths` (to a bundled/public path or pinned CDN) and
  exclude `onnxruntime-web` from `optimizeDeps` if needed. De-risked early in implementation.
- **DRY cleanup**: the mask cleanup is extracted to `mask.ts` so the browser and the Node
  verify share one implementation — `verify:seg` is the regression guard for cv code that
  Vitest can't run.
- **Lazy loading**: opencv.js (~9 MB) + ort-web + u2netp (4.6 MB) load on first photo, never
  at first paint (dynamic `import()`), consistent with the all-browser perf note.
- **Pure vs WASM split** held: `maskBBox`, `footprintFromBBox` are pure/tested; canvas + cv +
  ort stay in thin adapters validated by manual + Node verify.
- **Photo privacy**: decode is local (canvas); no network with the image. (R: architecture §2.)
```
