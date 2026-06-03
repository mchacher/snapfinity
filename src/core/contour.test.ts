import { describe, expect, it } from 'vitest';
import type { Point2D } from './offset';
import {
  chaikin,
  deleteNode,
  insertNode,
  moveNode,
  nearestNode,
  nearestSegment,
  rectifyStraightEdges,
  refineContour,
  simplify,
  simplifyForEdit,
  smoothContour,
} from './contour';

/**
 * Each edge's deviation (rad, abs) from the FIRST edge's axis, folded to ±45°. For a crisp
 * rectangle (any orientation) every edge is parallel or perpendicular to edge 0, so all
 * deviations are ≈ 0 — robust to how the whole shape is tilted.
 */
function axisDeviations(points: Point2D[]): number[] {
  const ang = (a: Point2D, b: Point2D) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const ref = ang(points[0], points[1]);
  return points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    let d = (((ang(a, b) - ref) % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2); // [0, π/2)
    if (d > Math.PI / 4) d -= Math.PI / 2; // fold to (−π/4, π/4]
    return Math.abs(d);
  });
}

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

describe('rectifyStraightEdges', () => {
  const maxDev = (pts: Point2D[]) => Math.max(...axisDeviations(pts));

  it('makes a wobbly axis-aligned rectangle crisply rectangular', () => {
    const noisy: Point2D[] = [
      [0, 1.5],
      [100, -1.2],
      [98.5, 50.8],
      [1.0, 49.0],
    ];
    expect(maxDev(noisy)).toBeGreaterThan((1 * Math.PI) / 180); // wobbly to start
    expect(maxDev(rectifyStraightEdges(noisy, 8))).toBeLessThan((0.3 * Math.PI) / 180);
  });

  it('works on a rotated object (snaps to its own axis)', () => {
    const theta = (20 * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const base: Point2D[] = [
      [0, 1.5],
      [100, -1.2],
      [98.5, 40.8],
      [1.0, 39.0],
    ];
    const rotated = base.map(([x, y]): Point2D => [x * cos - y * sin, x * sin + y * cos]);
    expect(maxDev(rectifyStraightEdges(rotated, 8))).toBeLessThan((0.3 * Math.PI) / 180);
  });

  it('leaves a diagonal edge (45° to the axis) untouched', () => {
    // a long horizontal edge sets the axis; the 45° edge is far from any axis → unchanged
    const pts: Point2D[] = [
      [0, 0],
      [100, 0],
      [60, 40],
      [0, 30],
    ];
    const out = rectifyStraightEdges(pts, 8);
    expect(out[2]).toEqual([60, 40]); // the diagonal corner is unmoved
  });

  it('is a no-op at tolerance 0 or < 3 points', () => {
    expect(rectifyStraightEdges(square, 0)).toEqual(square);
    expect(rectifyStraightEdges([[0, 0], [1, 1]], 8)).toEqual([[0, 0], [1, 1]]);
  });
});

describe('refineContour', () => {
  const opts = { smoothingFactor: 0.5, straighten: false, straightenToleranceDeg: 8 };

  it('matches smoothContour when straighten is off', () => {
    expect(refineContour(square, opts)).toEqual(smoothContour(square, 0.5));
  });

  it('keeps crisp corners (no rounding) when straighten is on', () => {
    const out = refineContour(square, { ...opts, straighten: true });
    // the 4 corners survive (Chaikin would have removed them)
    for (const c of square) expect(out).toContainEqual(c);
  });
});

// A 100×100 square ring (open list, implicitly closed) for the editable-contour tests.
const bigSquare: Point2D[] = [
  [0, 0],
  [100, 0],
  [100, 100],
  [0, 100],
];

describe('simplifyForEdit', () => {
  it('reduces a dense ring to ≤ max nodes', () => {
    // a 400-point circle
    const dense: Point2D[] = Array.from({ length: 400 }, (_, i) => {
      const a = (i / 400) * Math.PI * 2;
      return [500 + Math.cos(a) * 200, 500 + Math.sin(a) * 200] as Point2D;
    });
    const out = simplifyForEdit(dense, 40);
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out.length).toBeGreaterThanOrEqual(3);
  });

  it('leaves a tiny ring unchanged', () => {
    expect(simplifyForEdit(bigSquare, 48)).toHaveLength(4);
  });
});

describe('nearestNode', () => {
  it('finds the closest node within range', () => {
    expect(nearestNode(bigSquare, [98, 3], 10)).toBe(1); // near [100,0]
  });
  it('returns -1 when nothing is in range', () => {
    expect(nearestNode(bigSquare, [50, 50], 10)).toBe(-1); // centre, far from every corner
  });
});

describe('nearestSegment', () => {
  it('projects onto the closest edge', () => {
    const hit = nearestSegment(bigSquare, [50, 4], 10); // near the top edge 0→1
    expect(hit?.index).toBe(0);
    expect(hit?.point[1]).toBeCloseTo(0);
    expect(hit?.point[0]).toBeCloseTo(50);
  });
  it('includes the closing edge (3→0)', () => {
    const hit = nearestSegment(bigSquare, [4, 50], 10); // near the left edge 3→0
    expect(hit?.index).toBe(3);
  });
  it('returns null when far from every edge', () => {
    expect(nearestSegment(bigSquare, [50, 50], 5)).toBeNull();
  });
});

describe('moveNode / insertNode / deleteNode', () => {
  it('moves a node without mutating the input', () => {
    const out = moveNode(bigSquare, 0, [5, 5]);
    expect(out[0]).toEqual([5, 5]);
    expect(bigSquare[0]).toEqual([0, 0]); // original untouched
  });
  it('inserts a node after the given index', () => {
    const out = insertNode(bigSquare, 0, [50, 0]);
    expect(out).toHaveLength(5);
    expect(out[1]).toEqual([50, 0]);
  });
  it('deletes a node but keeps at least 3', () => {
    expect(deleteNode(bigSquare, 0)).toHaveLength(3);
    const tri: Point2D[] = [
      [0, 0],
      [10, 0],
      [5, 10],
    ];
    expect(deleteNode(tri, 0)).toHaveLength(3); // refuses to drop below 3
  });
});
