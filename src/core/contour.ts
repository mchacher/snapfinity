import type { Point2D } from './offset';

/** Perpendicular distance from point `p` to the line segment `a`–`b`. */
function perpDistance(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  const cx = a[0] + t * dx;
  const cy = a[1] + t * dy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}

/** Recursive Douglas–Peucker on an open polyline. */
function douglasPeucker(points: Point2D[], tolerance: number): Point2D[] {
  if (points.length < 3) return points.slice();
  const end = points.length - 1;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < end; i += 1) {
    const d = perpDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, index + 1), tolerance);
    const right = douglasPeucker(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[end]];
}

/**
 * Simplify a contour with Douglas–Peucker: drop points that lie within `tolerancePx` of the
 * line they sit on (removes pixel-staircase jaggies). Pure. `tolerancePx <= 0` or fewer than
 * 3 points → returned unchanged.
 */
export function simplify(points: Point2D[], tolerancePx: number): Point2D[] {
  if (tolerancePx <= 0 || points.length < 3) return points.slice();
  return douglasPeucker(points, tolerancePx);
}

/**
 * Chaikin corner-cutting on a closed ring: each edge is replaced by two points at 1/4 and 3/4,
 * rounding sharp corners. `iterations` passes (each ≈ doubles the point count). Pure.
 */
export function chaikin(points: Point2D[], iterations: number): Point2D[] {
  let pts = points.slice();
  for (let it = 0; it < iterations; it += 1) {
    if (pts.length < 3) break;
    const next: Point2D[] = [];
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    pts = next;
  }
  return pts;
}

/**
 * One "faithful → smooth" knob over a contour: `factor` 0..1 maps to a simplify tolerance
 * (`factor·6` px) then Chaikin rounding (`round(factor·3)` passes). Pure — cheap enough to run
 * on every slider tick. Fewer than 3 points are returned unchanged.
 */
export function smoothContour(points: Point2D[], factor: number): Point2D[] {
  if (points.length < 3) return points.slice();
  const f = Math.max(0, Math.min(1, factor));
  const tolerancePx = f * 6;
  const iterations = Math.round(f * 3);
  return chaikin(simplify(points, tolerancePx), iterations);
}
