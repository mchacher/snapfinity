import type { Point2D } from '../core/offset';

/** Normalised crop rectangle, each field in [0, 1] of the (rotated) image. */
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/**
 * Delta rotation (degrees) that makes the line `p1→p2` axis-aligned, **snapped to the nearer
 * axis**: horizontal when the line sits within 45° of horizontal, else vertical. Pure.
 *
 * The convention: after rotating the image content by this many degrees (same sign as
 * `Math.atan2` in image space, y-down), the drawn line becomes exactly horizontal or vertical.
 * A line and its reverse give the same result (orientation is folded to (−90°, 90°]).
 */
export function straightenAngleDeg(p1: Point2D, p2: Point2D): number {
  const raw = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI; // −180..180
  // fold to (−90, 90] — the line's orientation relative to horizontal
  const a = ((((raw + 90) % 180) + 180) % 180) - 90;
  if (Math.abs(a) <= 45) return -a; // near-horizontal → level it
  return a > 0 ? 90 - a : -90 - a; // near-vertical → bring it to ±90
}

/**
 * Two drag points (image px) → a normalised crop rect, clamped to [0,1] and order-independent
 * (a reversed drag still yields a positive rect). Pure.
 */
export function normaliseCrop(p1: Point2D, p2: Point2D, width: number, height: number): CropRect {
  const x1 = clamp01(Math.min(p1[0], p2[0]) / width);
  const y1 = clamp01(Math.min(p1[1], p2[1]) / height);
  const x2 = clamp01(Math.max(p1[0], p2[0]) / width);
  const y2 = clamp01(Math.max(p1[1], p2[1]) / height);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
