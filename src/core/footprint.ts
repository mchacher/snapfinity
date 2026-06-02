import type { Point2D } from './offset';
import { simplify } from './contour';

/**
 * Douglas–Peucker tolerance for the pocket polygon, in mm. Well below a typical 0.4 mm
 * nozzle (and layer resolution), so dropping points within it leaves the printed pocket
 * geometrically unchanged — it only removes the near-collinear points the clipper offset +
 * Chaikin rounding leave behind, which would otherwise become extra `lineTo` edges the
 * replicad boolean has to process.
 */
export const POCKET_SIMPLIFY_MM = 0.2;

/**
 * Decimate a pocket footprint (mm) for the CAD cut: Douglas–Peucker at `POCKET_SIMPLIFY_MM`.
 * Pure. Falls back to the original ring if simplification would leave a degenerate (< 3 pt)
 * polygon — so the caller always gets a valid ring.
 */
export function simplifyFootprintMm(footprint: Point2D[]): Point2D[] {
  const ring = simplify(footprint, POCKET_SIMPLIFY_MM);
  return ring.length >= 3 ? ring : footprint;
}

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
