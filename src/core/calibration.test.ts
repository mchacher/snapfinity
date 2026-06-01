import { describe, expect, it } from 'vitest';
import { TOKEN_DIAMETER_MM, mmPerPx, pxToMm } from './calibration';

describe('mmPerPx', () => {
  it('uses the nominal token OD by default', () => {
    expect(TOKEN_DIAMETER_MM).toBe(76.2);
    expect(mmPerPx(500)).toBeCloseTo(0.1524, 4);
  });

  it('accepts a caliper-measured OD override', () => {
    expect(mmPerPx(500, 80)).toBeCloseTo(0.16, 10);
  });

  it('throws on a non-positive or non-finite pixel diameter', () => {
    expect(() => mmPerPx(0)).toThrow();
    expect(() => mmPerPx(-10)).toThrow();
    expect(() => mmPerPx(Number.NaN)).toThrow();
    expect(() => mmPerPx(Number.POSITIVE_INFINITY)).toThrow();
  });

  it('throws on a non-positive OD override', () => {
    expect(() => mmPerPx(500, 0)).toThrow();
    expect(() => mmPerPx(500, -1)).toThrow();
  });
});

describe('pxToMm', () => {
  it('scales pixels to millimetres', () => {
    expect(pxToMm(100, 0.1524)).toBeCloseTo(15.24, 6);
  });

  it('maps 0 px to 0 mm', () => {
    expect(pxToMm(0, 0.1524)).toBe(0);
  });

  it('throws on an invalid scale or negative pixels', () => {
    expect(() => pxToMm(100, 0)).toThrow();
    expect(() => pxToMm(-1, 0.1524)).toThrow();
  });
});
