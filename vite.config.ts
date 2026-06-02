import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // CAD tests build real OpenCascade geometry + export STL — slower than the 5 s default,
    // especially on CI runners. Pure-logic tests still finish in ms.
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
