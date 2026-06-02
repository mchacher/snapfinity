import { describe, expect, it } from 'vitest';
import { pickExecutionProviders } from './providers';

describe('pickExecutionProviders', () => {
  it('prefers WebGPU with a WASM fallback when the GPU is available', () => {
    expect(pickExecutionProviders(true)).toEqual(['webgpu', 'wasm']);
  });

  it('uses WASM only when WebGPU is absent', () => {
    expect(pickExecutionProviders(false)).toEqual(['wasm']);
  });
});
