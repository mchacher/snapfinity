import type { Point2D } from './offset';

/**
 * Convert an offset contour (full-resolution pixels, image coords: origin top-left, y-down)
 * into the bin's pocket footprint: millimetres, centred on the origin (the bin is centred too),
 * with y flipped to CAD space (y-up). Centres on the contour's bounding-box centre so the
 * object sits in the middle of the bin. Pure. Returns `[]` for a degenerate input.
 */
export function contourToFootprintMm(offsetPx: Point2D[], scaleMmPerPx: number): Point2D[] {
  if (offsetPx.length < 3 || scaleMmPerPx <= 0) return [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of offsetPx) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return offsetPx.map(([x, y]): Point2D => [(x - cx) * scaleMmPerPx, -(y - cy) * scaleMmPerPx]);
}
