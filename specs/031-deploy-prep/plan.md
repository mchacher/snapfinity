# Plan 031 — deploy prep

1. **Measure the loaded WASM** — build, `vite preview`, headless capture of `/ort/` requests on the
   WebGPU path and the `navigator.gpu`-hidden fallback. Confirm both fetch only
   `ort-wasm-simd-threaded.asyncify.{wasm,mjs}`.
2. **Narrow the glob** — `vite.config.ts` `viteStaticCopy` →
   `node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.{wasm,mjs}`. Comment the why
   + the re-verify-on-upgrade caveat.
3. **Re-verify** — rebuild, confirm `dist/ort/` holds only the asyncify pair, `dist/` ~75 MB, no
   file > 25 MiB, and the app still segments + builds a bin with no console errors.
4. **Token assets** — `public/token/snapfinity-token.{stl,step}`; verify the STL bbox (~76.2 mm).
5. **Docs** — README "Calibration token" section (download + print/measure); rewrite hosting.md
   §1–§6 to the asyncify finding (Cloudflare unblocked, GitHub Pages shipping now).
6. **Gate + ship** — `typecheck`/`lint`/`build`; full `vitest run` green; branch `feat/deploy-prep`,
   index row 031, PR, merge after CI.

> The live GitHub Pages run + the v0.1 GitHub Release (token attached) happen **after** 031 + 032
> merge — an ops step, not part of this PR.
