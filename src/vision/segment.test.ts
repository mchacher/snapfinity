import { describe, expect, it } from 'vitest';
import { SEG_SIZE, adjustRgba, rgbaToTensor, saliencyToMask } from './segment';

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

describe('adjustRgba', () => {
  it('is the identity at (0, 0)', () => {
    const rgba = new Uint8Array([10, 128, 240, 255, 0, 50, 200, 128]);
    expect(Array.from(adjustRgba(rgba, 0, 0))).toEqual(Array.from(rgba));
  });

  it('brightness lifts light greys toward white (shadow → background)', () => {
    const grey = new Uint8Array([200, 200, 200, 255]);
    const out = adjustRgba(grey, 80, 0);
    expect(out[0]).toBe(255); // 200 + 80 clamps to 255
    expect(out[3]).toBe(255); // alpha untouched
  });

  it('contrast pushes a light grey up and keeps mid-grey fixed', () => {
    expect(adjustRgba(new Uint8Array([128, 128, 128, 255]), 0, 60)[0]).toBe(128); // pivot at 128
    expect(adjustRgba(new Uint8Array([180, 180, 180, 255]), 0, 60)[0]).toBeGreaterThan(180);
  });
});

describe('saliencyToMask', () => {
  it('min-max normalises then thresholds', () => {
    const mask = saliencyToMask(new Float32Array([0, 0.25, 0.5, 1]), 0.5);
    expect(Array.from(mask)).toEqual([0, 0, 255, 255]);
  });
});
