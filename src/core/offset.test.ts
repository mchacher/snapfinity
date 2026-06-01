import { describe, expect, it } from 'vitest';
import { offsetPolygon, type Point2D } from './offset';

const square = (s: number): Point2D[] => [
  [0, 0],
  [s, 0],
  [s, s],
  [0, s],
];

function bbox(pts: Point2D[]) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

describe('offsetPolygon', () => {
  it('grows a square outward by delta on every side', () => {
    const b = bbox(offsetPolygon(square(10), 1));
    expect(b.minX).toBeCloseTo(-1, 2);
    expect(b.maxX).toBeCloseTo(11, 2);
    expect(b.minY).toBeCloseTo(-1, 2);
    expect(b.maxY).toBeCloseTo(11, 2);
  });

  it('shrinks a square with a negative delta', () => {
    const b = bbox(offsetPolygon(square(10), -1));
    expect(b.minX).toBeCloseTo(1, 2);
    expect(b.maxX).toBeCloseTo(9, 2);
  });

  it('returns an empty polygon when an inset collapses it', () => {
    expect(offsetPolygon(square(10), -10)).toEqual([]);
  });

  it('throws on too few points or a non-finite delta', () => {
    expect(() =>
      offsetPolygon(
        [
          [0, 0],
          [1, 1],
        ],
        1,
      ),
    ).toThrow();
    expect(() => offsetPolygon(square(10), Number.NaN)).toThrow();
  });
});
