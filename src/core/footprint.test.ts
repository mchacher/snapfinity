import { describe, expect, it } from 'vitest';
import type { Point2D } from './offset';
import { contourToFootprintMm } from './footprint';

describe('contourToFootprintMm', () => {
  it('centres on the bbox, scales to mm, and flips y', () => {
    const squarePx: Point2D[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    // centre (5,5), scale 0.5 → ±2.5; y negated
    expect(contourToFootprintMm(squarePx, 0.5)).toEqual([
      [-2.5, 2.5],
      [2.5, 2.5],
      [2.5, -2.5],
      [-2.5, -2.5],
    ]);
  });

  it('is centred on the origin (mean of the bbox is 0)', () => {
    const pts: Point2D[] = [
      [2, 4],
      [20, 4],
      [20, 18],
      [2, 18],
    ];
    const mm = contourToFootprintMm(pts, 1);
    const xs = mm.map((p) => p[0]);
    const ys = mm.map((p) => p[1]);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(0, 9);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(0, 9);
  });

  it('returns [] for fewer than 3 points or a non-positive scale', () => {
    expect(contourToFootprintMm([[0, 0], [1, 1]], 0.5)).toEqual([]);
    expect(contourToFootprintMm([[0, 0], [1, 0], [0, 1]], 0)).toEqual([]);
  });
});
