# Architecture 031 — deploy prep

## The WASM-glob decision (measured)

`src/vision/seg-runtime.ts` imports `onnxruntime-web/webgpu` and sets
`ort.env.wasm.wasmPaths = ${BASE_URL}ort/`, `numThreads = 1`, with EPs `['webgpu','wasm']`
(`providers.ts`). The open question was **which** of onnxruntime-web's four WASM builds the runtime
fetches from `/ort/`. The doc had *assumed* jsep (25.02 MiB, the one file over Cloudflare's limit).

**Method:** build, serve `dist/` with `vite preview`, drive a real photo through the pipeline in
headless Chrome, and log every request to `/ort/` / `*.wasm` / `*.onnx` — once with WebGPU
available, once with `navigator.gpu` hidden (the Safari/Firefox fallback).

**Result (both paths identical):**
```
/ort/ort-wasm-simd-threaded.asyncify.mjs
/ort/ort-wasm-simd-threaded.asyncify.wasm   ← 22.6 MiB, the only ORT wasm loaded
/models/u2netp.onnx
/assets/replicad_single-*.wasm              ← CAD, separate
```
The `webgpu` entry's glue is the **asyncify** build for *both* the `webgpu` and `wasm` EPs; **jsep
is never fetched.** So the glob is narrowed to `ort-wasm-simd-threaded.asyncify.{wasm,mjs}`. This
both shrinks `dist/` (~146 → ~75 MB) and removes the unused 25.02 MiB jsep file — the only asset
over Cloudflare's 25 MiB limit — so the deploy is Cloudflare-ready with no CDN workaround.

**Residual:** Rollup still emits a second, unused ~23 MB asyncify copy under `assets/` (the
`onnxruntime-web/webgpu` module references it via `new URL(..., import.meta.url)`). It's never
fetched (runtime `wasmPaths` → `/ort/` wins) and is under the limit; removing it would need a
build-time URL stub — out of scope, documented in hosting.md §6.

> Version caveat: a `onnxruntime-web` bump can change which build the `webgpu` entry pulls.
> Re-run the `/ort/` capture after any upgrade. (Comment lives in `vite.config.ts`.)

## Token assets

`public/` is copied verbatim to `dist/` root by Vite, so files under `public/token/` are served at
`/token/...` on any host (subpath-safe via `BASE_URL`). We ship:
- `snapfinity-token.stl` — print-ready (binary STL, OD verified 76.19 mm ≈ the 76.2 mm default in
  `core/calibration.ts` / `vision/token.ts`);
- `snapfinity-token.step` — editable source for anyone who wants to tweak it.

The landing page (spec 032) and README link straight to these paths; no code imports them.

## Why no spec-032 coupling

031 is deploy plumbing — config + static assets + docs, no UI. It can merge and CI-pass on its own.
The download *links* that surface these assets live in 032 (landing) + the README, so 031 doesn't
touch any component.
