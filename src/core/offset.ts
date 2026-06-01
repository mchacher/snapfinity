import ClipperLib from 'clipper-lib';

export type Point2D = [number, number];

/** Clipper works on integers; scale mm → integer units (1000 ≈ µm precision). */
const SCALE = 1000;

/**
 * Offset a closed polygon outward (positive `deltaMm`) or inward (negative) with rounded
 * joins — the printing-clearance step, matching the oracle's pyclipper
 * (`JT_ROUND` / `ET_CLOSEDPOLYGON`). Returns the offset ring, or `[]` if an inset collapses it.
 */
export function offsetPolygon(points: Point2D[], deltaMm: number): Point2D[] {
  if (points.length < 3) {
    throw new Error(`offsetPolygon needs at least 3 points, got ${points.length}`);
  }
  if (!Number.isFinite(deltaMm)) {
    throw new Error(`deltaMm must be finite, got ${deltaMm}`);
  }

  const path = points.map(([x, y]) => ({ X: Math.round(x * SCALE), Y: Math.round(y * SCALE) }));
  const co = new ClipperLib.ClipperOffset();
  co.AddPath(path, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);

  const solution: { X: number; Y: number }[][] = [];
  co.Execute(solution, deltaMm * SCALE);
  if (solution.length === 0) return [];

  return solution[0].map((p): Point2D => [p.X / SCALE, p.Y / SCALE]);
}
