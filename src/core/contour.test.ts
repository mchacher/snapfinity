import { describe, expect, it } from 'vitest';
import type { Point2D } from './offset';
import { chaikin, simplify, smoothContour } from './contour';

const square: Point2D[] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

describe('simplify', () => {
  it('drops collinear points on a straight edge', () => {
    const line: Point2D[] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ];
    expect(simplify(line, 0.1)).toEqual([
      [0, 0],
      [3, 0],
    ]);
  });

  it('keeps the corners of a triangle', () => {
    const tri: Point2D[] = [
      [0, 0],
      [10, 0],
      [5, 8],
    ];
    expect(simplify(tri, 1)).toEqual(tri);
  });

  it('returns the input unchanged at tolerance 0 or < 3 points', () => {
    expect(simplify(square, 0)).toEqual(square);
    expect(simplify([[0, 0], [1, 1]], 5)).toEqual([[0, 0], [1, 1]]);
  });
});

describe('chaikin', () => {
  it('doubles the points of a closed ring per pass', () => {
    expect(chaikin(square, 1)).toHaveLength(8);
    expect(chaikin(square, 2)).toHaveLength(16);
  });

  it('cuts the corner — the cut points straddle each original vertex', () => {
    const cut = chaikin(square, 1);
    // first edge [0,0]->[10,0] yields the 1/4 and 3/4 points
    expect(cut[0]).toEqual([2.5, 0]);
    expect(cut[1]).toEqual([7.5, 0]);
    // no point sits exactly on the original sharp corner [0,0]
    expect(cut).not.toContainEqual([0, 0]);
  });

  it('returns the input unchanged with 0 iterations', () => {
    expect(chaikin(square, 0)).toEqual(square);
  });
});

describe('smoothContour', () => {
  it('is faithful (unchanged) at factor 0', () => {
    expect(smoothContour(square, 0)).toEqual(square);
  });

  it('rounds the sharp corners at factor 1 (no original vertex survives)', () => {
    const smooth = smoothContour(square, 1);
    expect(smooth.length).toBeGreaterThanOrEqual(3);
    expect(smooth).not.toContainEqual([0, 0]);
  });

  it('clamps the factor and leaves < 3 points alone', () => {
    expect(smoothContour([[0, 0], [1, 1]], 1)).toEqual([[0, 0], [1, 1]]);
    expect(smoothContour(square, 5)).toEqual(smoothContour(square, 1));
  });
});
