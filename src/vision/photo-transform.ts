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

/** Smallest crop side, as a fraction of the image — keeps the zone non-degenerate. */
export const MIN_CROP = 0.05;

/** Which of the 8 resize handles: corners + edge midpoints. Letters say which edges follow. */
export type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** A centred inset crop zone (proposed immediately when the crop tool opens). Pure. */
export function defaultCropBox(margin = 0.08): CropRect {
  const m = clamp01(margin);
  return { x: m, y: m, w: 1 - 2 * m, h: 1 - 2 * m };
}

/**
 * Drag `handle` to the normalised pointer `(px, py)`: only the edge(s) the handle's letters name
 * (`w`/`e`/`n`/`s`) move; the opposite edges stay. Enforces `MIN_CROP` and clamps to [0,1]. Pure.
 */
export function resizeCropBox(box: CropRect, handle: CropHandle, px: number, py: number): CropRect {
  let left = box.x;
  let right = box.x + box.w;
  let top = box.y;
  let bottom = box.y + box.h;
  const cx = clamp01(px);
  const cy = clamp01(py);
  if (handle.includes('w')) left = Math.min(cx, right - MIN_CROP);
  if (handle.includes('e')) right = Math.max(cx, left + MIN_CROP);
  if (handle.includes('n')) top = Math.min(cy, bottom - MIN_CROP);
  if (handle.includes('s')) bottom = Math.max(cy, top + MIN_CROP);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * Rotate a crop rect by a quarter-turn so it keeps selecting the same content when the photo is
 * turned ±90°. `dir` matches `rotate90`: +1 = clockwise (+90°), −1 = counter-clockwise. Turning
 * the image swaps width/height; this maps the (normalised) rect into the turned frame. Pure.
 * `+90` then `−90` round-trips back to the original rect.
 */
export function rotateCrop90(crop: CropRect | null, dir: 1 | -1): CropRect | null {
  if (!crop) return null;
  const { x, y, w, h } = crop;
  return dir === 1
    ? { x: 1 - y - h, y: x, w: h, h: w } // +90° clockwise: (x,y) → (1−y, x)
    : { x: y, y: 1 - x - w, w: h, h: w }; // −90° counter-clockwise: (x,y) → (y, 1−x)
}

/** Translate the zone by `(dx, dy)` (normalised), clamped so it stays fully inside [0,1]. Pure. */
export function moveCropBox(box: CropRect, dx: number, dy: number): CropRect {
  return {
    x: Math.max(0, Math.min(1 - box.w, box.x + dx)),
    y: Math.max(0, Math.min(1 - box.h, box.y + dy)),
    w: box.w,
    h: box.h,
  };
}
