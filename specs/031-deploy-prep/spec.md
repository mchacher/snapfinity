# Spec 031 — deploy prep (size hygiene + printable token)

## Overview

Get Snapfinity ready to put in front of friends on a public static host. Two concrete blockers,
both outside the app's features:

1. **`dist/` was ~146 MB** — `viteStaticCopy` copied **all four** onnxruntime-web WASM builds, but
   the app only ever loads one. Heavy first-visit download and a slow deploy.
2. **No printable token in the repo.** Snapfinity is useless without the *exact* physical
   calibration token (76.2 mm, 6-fold hole pattern). The CAD existed only on the author's disk —
   a friend had no way to get one.

## Goals

- Ship only the WASM build the runtime actually fetches → smaller, faster, and **Cloudflare-
  compatible** (no file over its 25 MiB per-file limit).
- Put a print-ready token (STL + STEP) in the repo, served as a downloadable static asset.
- Correct [hosting.md](../../docs/technical/hosting.md): the loaded ORT build is **asyncify**
  (22.6 MiB), **not** the 25.02 MiB jsep the doc assumed — measured, not guessed.

## Non-goals

- The landing page / onboarding UI (spec 032).
- Actually flipping the site live (the GitHub Pages run + GitHub Release is an ops step after 031
  and 032 merge).
- Eliminating the residual unused ~23 MB asyncify duplicate Rollup emits under `assets/` (needs a
  build-time stub; under the limit, not worth the risk — documented).

## Requirements

- **WASM glob** — `vite.config.ts` `viteStaticCopy` narrowed from `dist/*.{wasm,mjs}` to
  `ort-wasm-simd-threaded.asyncify.{wasm,mjs}`. Verified by capturing the real `/ort/` requests in
  a headless browser on **both** the WebGPU and the no-WebGPU (`navigator.gpu` hidden) paths —
  each fetches only the asyncify pair; the app segments + builds a bin with **no console errors**.
- **Token assets** — `public/token/snapfinity-token.stl` (binary STL, OD ≈ 76.2 mm, verified
  76.19 × 75.38 × 2.0 mm) + `public/token/snapfinity-token.step` (editable source). Served at
  `/token/...` so a download link works on the deployed site.
- **README** — a "Calibration token" section: download + print-at-100 %, measure your printed OD
  with calipers and set it in the app.
- **hosting.md** — §1–§6 corrected to the asyncify finding (loaded file is under 25 MiB; narrowing
  the glob removes the oversized unused jsep → Cloudflare accepts as-is, no CDN workaround).

## Acceptance criteria

- [x] `dist/` ≤ ~80 MB (was ~146 MB); **no file > 25 MiB**.
- [x] App still segments (u2netp) and builds a bin with the asyncify-only glob — WebGPU **and**
      no-WebGPU paths, zero console errors (headless network capture).
- [x] Token STL + STEP present under `public/token/` and copied into `dist/token/` by the build.
- [x] `typecheck` / `lint` / `build` clean; full `vitest run` green (no hang).

## Scope

**In:** `vite.config.ts` glob, `public/token/*`, README token section, `hosting.md` correction,
this spec + index row. **Out:** landing UI (032), the live deploy + release (ops, post-merge).
