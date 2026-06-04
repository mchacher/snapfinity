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
/**
 * Simplify tolerance scaled to the contour's own size — the outline is in full-res px, so a fixed
 * pixel tolerance is invisible at display scale. ~2.5 % of the object's max dimension at factor 1,
 * which makes the smoothing actually visible whatever the image resolution.
 */
function smoothingTolerancePx(points: Point2D[], f: number): number {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return f * Math.max(maxX - minX, maxY - minY) * 0.025;
}

export function smoothContour(points: Point2D[], factor: number): Point2D[] {
  if (points.length < 3) return points.slice();
  const f = Math.max(0, Math.min(1, factor));
  return chaikin(simplify(points, smoothingTolerancePx(points, f)), Math.round(f * 4));
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

// ── Editable contour (spec 035) ────────────────────────────────────────────────
// Pure helpers for hand-editing a closed contour as a polygon of draggable nodes. Points are in
// full-res image px; the ring is implicitly closed (segment N-1 → 0 included).

function boundingDiag(points: Point2D[]): number {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return Math.hypot(maxX - minX, maxY - minY);
}

/** Closest point on segment `a`–`b` to `p`, plus the squared distance to it. */
function closestOnSegment(p: Point2D, a: Point2D, b: Point2D): { point: Point2D; dist2: number } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  const point: Point2D = [a[0] + t * dx, a[1] + t * dy];
  const ddx = p[0] - point[0];
  const ddy = p[1] - point[1];
  return { point, dist2: ddx * ddx + ddy * ddy };
}

/**
 * Reduce a contour to a hand-editable number of nodes: Douglas–Peucker with the tolerance raised
 * until the node count is ≤ `max` (default 48). Already-small rings get a light cleanup. Pure.
 */
export function simplifyForEdit(points: Point2D[], max = 48): Point2D[] {
  if (points.length <= 3) return points.slice();
  const diag = boundingDiag(points) || 1;
  let tol = diag * 0.004;
  let out = simplify(points, tol);
  let guard = 0;
  while (out.length > max && guard < 24) {
    tol *= 1.5;
    out = simplify(points, tol);
    guard += 1;
  }
  return out.length >= 3 ? out : points.slice();
}

/** Index of the node within `maxDist` (image px) of `p`, nearest first, or -1. */
export function nearestNode(points: Point2D[], p: Point2D, maxDist: number): number {
  let best = -1;
  let bestD2 = maxDist * maxDist;
  for (let i = 0; i < points.length; i += 1) {
    const dx = points[i][0] - p[0];
    const dy = points[i][1] - p[1];
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD2) {
      bestD2 = d2;
      best = i;
    }
  }
  return best;
}

/**
 * Nearest segment of the closed ring to `p` within `maxDist` (image px). Returns the segment's
 * start index (segment goes from `index` to `(index+1) % n`) and the projected point on it, or null.
 */
export function nearestSegment(
  points: Point2D[],
  p: Point2D,
  maxDist: number,
): { index: number; point: Point2D } | null {
  const n = points.length;
  if (n < 2) return null;
  let best: { index: number; point: Point2D } | null = null;
  let bestD2 = maxDist * maxDist;
  for (let i = 0; i < n; i += 1) {
    const { point, dist2 } = closestOnSegment(p, points[i], points[(i + 1) % n]);
    if (dist2 <= bestD2) {
      bestD2 = dist2;
      best = { index: i, point };
    }
  }
  return best;
}

/** Replace node `i` with `p`. Pure (returns a new ring). */
export function moveNode(points: Point2D[], i: number, p: Point2D): Point2D[] {
  if (i < 0 || i >= points.length) return points.slice();
  const out = points.slice();
  out[i] = [p[0], p[1]];
  return out;
}

/** Insert `p` just after node `afterIndex` (so it lands on the segment afterIndex→afterIndex+1). */
export function insertNode(points: Point2D[], afterIndex: number, p: Point2D): Point2D[] {
  const out = points.slice();
  out.splice(afterIndex + 1, 0, [p[0], p[1]]);
  return out;
}

/** Remove node `i`, keeping at least 3 nodes (a closed polygon). Pure. */
export function deleteNode(points: Point2D[], i: number): Point2D[] {
  if (points.length <= 3 || i < 0 || i >= points.length) return points.slice();
  const out = points.slice();
  out.splice(i, 1);
  return out;
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
  if (opts.straighten) {
    return rectifyStraightEdges(simplify(points, smoothingTolerancePx(points, f)), opts.straightenToleranceDeg);
  }
  return smoothContour(points, f);
}
