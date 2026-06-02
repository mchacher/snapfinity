import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
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
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.{wasm,mjs}',
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
