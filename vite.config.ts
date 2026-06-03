import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Expose the package version to the app (shown in the UI) — single source of truth.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Host-agnostic base path: `/` by default (root domain / Cloudflare Pages), or a project
  // subpath like `/snapfinity/` for GitHub Pages — set BASE_PATH at build time. Runtime assets
  // resolve via `import.meta.env.BASE_URL`, so a subpath just works (see spec 022).
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
    // Serve onnxruntime-web's WASM/glue assets flat under /ort/ (dev + build) so segmentation
    // runs fully offline — no CDN. `ort.env.wasm.wasmPaths` points here (see seg-runtime.ts).
    // `stripBase: true` flattens the node_modules path so files land directly in /ort/.
    //
    // We import `onnxruntime-web/webgpu` with `numThreads = 1`. Both execution providers we use
    // (`webgpu` and the `wasm` fallback) load the **asyncify** build at runtime — verified by
    // capturing the actual `/ort/` requests in both the WebGPU and no-WebGPU paths: each fetches
    // only `ort-wasm-simd-threaded.asyncify.{wasm,mjs}`. Copying the whole `dist/*` also dragged in
    // the jsep (25 MiB), jspi (14 MB) and plain-simd (13 MB) variants — dead weight that tripled
    // `dist/`. Narrowing to the one build we load also drops the **25.02 MiB jsep file**, the only
    // asset over Cloudflare Pages' 25 MiB per-file limit — so the deploy is Cloudflare-compatible
    // too (the loaded asyncify file is 22.6 MiB). NB: re-verify this glob if onnxruntime-web is
    // upgraded (a version bump can change which wasm build the webgpu entry pulls).
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.{wasm,mjs}',
          dest: 'ort',
          rename: { stripBase: true },
        },
      ],
    }),
  ],
  // onnxruntime-web ships its own prebuilt wasm/glue; don't let Vite pre-bundle it.
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // CAD tests build real OpenCascade geometry + export STL — slower than the 5 s default,
    // especially on CI runners. Pure-logic tests still finish in ms.
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
