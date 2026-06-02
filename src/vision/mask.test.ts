import { describe, expect, it } from 'vitest';
import { maskBBox } from './mask';

/** Build a width×height mask with the given rectangle set to 255. */
function maskWithRect(width: number, height: number, x: number, y: number, w: number, h: number): Uint8Array {
  const m = new Uint8Array(width * height);
  for (let yy = y; yy < y + h; yy += 1) for (let xx = x; xx < x + w; xx += 1) m[yy * width + xx] = 255;
  return m;
}

describe('maskBBox', () => {
  it('returns the bbox of a filled rectangle', () => {
    expect(maskBBox(maskWithRect(10, 10, 2, 3, 4, 5), 10, 10)).toEqual({ x: 2, y: 3, w: 4, h: 5 });
  });

  it('covers the whole image when fully set', () => {
    const full = new Uint8Array(6 * 4).fill(255);
    expect(maskBBox(full, 6, 4)).toEqual({ x: 0, y: 0, w: 6, h: 4 });
  });

  it('tightly bounds scattered set pixels', () => {
    const m = new Uint8Array(10 * 10);
    m[1 * 10 + 1] = 255; // (1,1)
    m[7 * 10 + 8] = 255; // (8,7)
    expect(maskBBox(m, 10, 10)).toEqual({ x: 1, y: 1, w: 8, h: 7 });
  });

  it('returns a 1×1 box for a single set pixel', () => {
    const m = new Uint8Array(5 * 5);
    m[2 * 5 + 3] = 255;
    expect(maskBBox(m, 5, 5)).toEqual({ x: 3, y: 2, w: 1, h: 1 });
  });

  it('returns null for an all-zero mask', () => {
    expect(maskBBox(new Uint8Array(4 * 4), 4, 4)).toBeNull();
  });
});
