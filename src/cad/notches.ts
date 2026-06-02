import { makeCylinder, type Shape3D } from 'replicad';
import { HEIGHT_UNIT_MM } from '../core/sizing';
import { binDimensions, TOP_RISE, type BinParams } from './bin';
import type { NotchConfig } from './cad-messages';

/** Default two-finger spacing target (centre-to-centre), in mm. */
const FINGER_SPACING_MM = 28;

/**
 * Carve **two finger scoops** into the front-wall rim so two fingers of one hand can lift the
 * tool out. Each scoop is a cylinder whose axis is perpendicular to the front wall, centred on
 * the rim → a clean semicircular cut (the top half is air). The outer envelope is preserved.
 *
 * No-op when disabled or when the wall is too small for two scoops; the radius is clamped so the
 * scoop stays in the body (above the feet).
 */
export function cutGripNotches(bin: Shape3D, params: BinParams, notch: NotchConfig): Shape3D {
  if (!notch.enabled) return bin;

  const { width: W, depth: D } = binDimensions(params);
  const rimZ = params.heightUnits * HEIGHT_UNIT_MM + TOP_RISE;

  const r = Math.max(3, Math.min(notch.radiusMm, rimZ - 2));
  if (W < 2 * r + 4) return bin; // wall too short for two scoops — leave the rim intact

  const spacing = Math.min(Math.max(2 * r + 6, FINGER_SPACING_MM), W - 2 * r - 4);
  const len = 2 * r + 4; // span the outer face inward, carving the rim
  const wallY = -D / 2; // front wall (min Y)

  let out = bin;
  for (const cx of [-spacing / 2, spacing / 2]) {
    // axis along +Y, centred on the wall: location is the start of the cylinder run.
    const cutter = makeCylinder(r, len, [cx, wallY - len / 2, rimZ], [0, 1, 0]);
    out = out.cut(cutter);
  }
  return out;
}
