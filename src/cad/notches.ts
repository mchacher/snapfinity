import { makeCylinder, type Shape3D } from 'replicad';
import { HEIGHT_UNIT_MM } from '../core/sizing';
import { binDimensions, TOP_RISE, type BinParams } from './bin';
import type { Point2D } from '../core/offset';
import type { NotchConfig } from './cad-messages';

export interface NotchContext {
  /** Pocket footprint (mm, centred) — used to default the grips to the object's edge. */
  footprint: Point2D[] | null;
  /** Pocket depth (mm) — the vertical finger scoop matches it. */
  depthMm: number;
}

/** Half-width / mid-depth of the object (mm), or a bin-based fallback when there's no pocket. */
function objectEdge(footprint: Point2D[] | null, W: number): { edgeX: number; centerY: number } {
  if (footprint && footprint.length >= 3) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of footprint) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { edgeX: Math.max(maxX, -minX), centerY: (minY + maxY) / 2 };
  }
  return { edgeX: W / 4, centerY: 0 };
}

/**
 * Carve a **two-finger pinch grip at the object's edge**: a symmetric pair of **vertical**
 * (Z-axis) finger scoops cut down from the top, one on each side of the pocket, so a finger
 * slides down beside the object to lift it out. They default to the object's left/right edge
 * (mid-depth); the user nudges the pair symmetrically with X/Y offsets. The outer envelope is
 * preserved. No-op when disabled.
 */
export function cutGripNotches(bin: Shape3D, params: BinParams, notch: NotchConfig, ctx: NotchContext): Shape3D {
  if (!notch.enabled) return bin;

  const { width: W, depth: D } = binDimensions(params);
  const topZ = params.heightUnits * HEIGHT_UNIT_MM; // pocket is cut from here
  const rimZ = topZ + TOP_RISE;
  const r = Math.max(3, Math.min(notch.radiusMm, W / 2 - 1, D / 2 - 1));

  const { edgeX, centerY } = objectEdge(ctx.footprint, W);

  // Symmetric pair at (±cx, cy): default at the object edge + the user's X/Y offset, clamped so
  // each scoop stays inside the bin's outer walls.
  const cx = Math.max(0, Math.min(edgeX + notch.offsetXMm, W / 2 - r - 0.5));
  const cy = Math.max(-(D / 2 - r - 0.5), Math.min(centerY + notch.offsetYMm, D / 2 - r - 0.5));

  // Vertical cut from clearly above the rim down to the pocket floor (a blind finger channel).
  // The top must overshoot the rim by a healthy margin: a near-coincident top face against the
  // lip profile makes the OpenCascade boolean fail and silently return the bin unchanged.
  const floorZ = topZ - Math.min(ctx.depthMm, topZ - 1);
  const topStart = rimZ + 5;
  const height = topStart - floorZ;

  let out = bin;
  for (const sx of [1, -1]) {
    const cutter = makeCylinder(r, height, [sx * cx, cy, topStart], [0, 0, -1]);
    out = out.cut(cutter);
  }
  return out;
}
