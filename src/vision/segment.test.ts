import { describe, expect, it } from 'vitest';
import { SEG_SIZE, rgbaToTensor, saliencyToMask } from './segment';

describe('rgbaToTensor', () => {
  it('produces a CHW tensor of the right length', () => {
    const rgba = new Uint8Array(SEG_SIZE * SEG_SIZE * 4).fill(255);
    const tensor = rgbaToTensor(rgba);
    expect(tensor.length).toBe(3 * SEG_SIZE * SEG_SIZE);
  });

  it('applies ImageNet normalisation per channel', () => {
    const rgba = new Uint8Array(SEG_SIZE * SEG_SIZE * 4).fill(255); // pure white
    const tensor = rgbaToTensor(rgba);
    // white (1.0) → (1 - 0.485) / 0.229 ≈ 2.249 on the R channel
    expect(tensor[0]).toBeCloseTo((1 - 0.485) / 0.229, 3);
  });
});

describe('saliencyToMask', () => {
  it('min-max normalises then thresholds', () => {
    const mask = saliencyToMask(new Float32Array([0, 0.25, 0.5, 1]), 0.5);
    expect(Array.from(mask)).toEqual([0, 0, 255, 255]);
  });
});
