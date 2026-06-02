import { describe, expect, it } from 'vitest';
import type { Point2D } from './offset';
import { contourToFootprintMm, simplifyFootprintMm, POCKET_SIMPLIFY_MM } from './footprint';

function bbox(pts: Point2D[]) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

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

describe('simplifyFootprintMm', () => {
  // A 10 mm square ring with a collinear midpoint inserted on each edge (8 points).
  const squareWithMidpoints: Point2D[] = [
    [-10, -10],
    [0, -10],
    [10, -10],
    [10, 0],
    [10, 10],
    [0, 10],
    [-10, 10],
    [-10, 0],
  ];
  const corners: Point2D[] = [
    [-10, -10],
    [10, -10],
    [10, 10],
    [-10, 10],
  ];

  it('drops collinear points but keeps every real corner', () => {
    const out = simplifyFootprintMm(squareWithMidpoints);
    expect(out.length).toBeLessThan(squareWithMidpoints.length);
    for (const c of corners) {
      expect(out).toContainEqual(c);
    }
  });

  it('preserves the bounding box (extreme points are kept)', () => {
    const before = bbox(squareWithMidpoints);
    const after = bbox(simplifyFootprintMm(squareWithMidpoints));
    expect(after.minX).toBeCloseTo(before.minX, 6);
    expect(after.maxX).toBeCloseTo(before.maxX, 6);
    expect(after.minY).toBeCloseTo(before.minY, 6);
    expect(after.maxY).toBeCloseTo(before.maxY, 6);
  });

  it('leaves an already-minimal ring (a triangle) unchanged', () => {
    const tri: Point2D[] = [
      [0, 0],
      [10, 0],
      [5, 8],
    ];
    expect(simplifyFootprintMm(tri)).toEqual(tri);
  });

  it('falls back to the input ring when simplification would degenerate (< 3 pts)', () => {
    const twoPts: Point2D[] = [
      [0, 0],
      [1, 1],
    ];
    expect(simplifyFootprintMm(twoPts)).toEqual(twoPts);
  });

  it('uses a sub-nozzle tolerance', () => {
    expect(POCKET_SIMPLIFY_MM).toBeLessThan(0.4);
  });
});
