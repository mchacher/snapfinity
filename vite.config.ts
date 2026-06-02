import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // CAD tests build real OpenCascade geometry + export STL — slower than the 5 s default,
    // especially on CI runners. Pure-logic tests still finish in ms.
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
