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

/** Orientation of the longest edge, folded to [0, π/2) — the polygon's dominant axis. */
function dominantAxisAngle(points: Point2D[]): number {
  let best = 0;
  let bestLen = -1;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = dx * dx + dy * dy;
    if (len > bestLen) {
      bestLen = len;
      best = Math.atan2(dy, dx);
    }
  }
  const half = Math.PI / 2;
  return ((best % half) + half) % half;
}

function rotatePoint(p: Point2D, angle: number, cx: number, cy: number): Point2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p[0] - cx;
  const dy = p[1] - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

/**
 * Straighten near-axis edges: snap each edge that is within `toleranceDeg` of the polygon's
 * dominant axis (or its perpendicular) to exactly that direction, by equalising the relevant
 * coordinate of its two endpoints. Runs in the dominant-axis frame, so it handles objects that
 * are rotated in the photo. Pure; closure is preserved (vertices are nudged in place). Fewer
 * than 3 points or `toleranceDeg <= 0` → returned unchanged.
 */
export function rectifyStraightEdges(points: Point2D[], toleranceDeg: number): Point2D[] {
  if (points.length < 3 || toleranceDeg <= 0) return points.slice();
  const axis = dominantAxisAngle(points);
  let cx = 0;
  let cy = 0;
  for (const [x, y] of points) {
    cx += x;
    cy += y;
  }
  cx /= points.length;
  cy /= points.length;

  const rot = points.map((p) => rotatePoint(p, -axis, cx, cy));
  const tol = (toleranceDeg * Math.PI) / 180;
  const n = rot.length;
  for (let i = 0; i < n; i += 1) {
    const a = rot[i];
    const b = rot[(i + 1) % n];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const m = ((ang % Math.PI) + Math.PI) % Math.PI; // edge direction folded to [0, π)
    if (m < tol || m > Math.PI - tol) {
      const my = (a[1] + b[1]) / 2; // near-horizontal → flatten
      a[1] = my;
      b[1] = my;
    } else if (Math.abs(m - Math.PI / 2) < tol) {
      const mx = (a[0] + b[0]) / 2; // near-vertical → align
      a[0] = mx;
      b[0] = mx;
    }
  }
  return rot.map((p) => rotatePoint(p, axis, cx, cy));
}

export interface RefineOptions {
  /** Smoothing knob 0..1 (drives the simplify tolerance + Chaikin rounding). */
  smoothingFactor: number;
  /** Straighten near-axis edges instead of rounding them. */
  straighten: boolean;
  /** How close to the axis an edge must be (degrees) to get snapped. */
  straightenToleranceDeg: number;
}

/**
 * Contour-refinement entry used by the UI: simplify, then either **straighten** near-axis edges
 * (crisp corners, no rounding) or apply Chaikin **rounding**. Pure. Fewer than 3 points are
 * returned unchanged.
 */
export function refineContour(points: Point2D[], opts: RefineOptions): Point2D[] {
  if (points.length < 3) return points.slice();
  const f = Math.max(0, Math.min(1, opts.smoothingFactor));
  const simplified = simplify(points, f * 6);
  if (opts.straighten) return rectifyStraightEdges(simplified, opts.straightenToleranceDeg);
  return chaikin(simplified, Math.round(f * 3));
}
