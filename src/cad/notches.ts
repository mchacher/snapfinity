import { makeCylinder, type Shape3D } from 'replicad';
import { HEIGHT_UNIT_MM } from '../core/sizing';
import { binDimensions, TOP_RISE, type BinParams } from './bin';
import type { NotchConfig } from './cad-messages';

/**
 * Carve a **two-finger pinch grip**: one semicircular finger scoop on each of the two **longer
 * opposing walls**, facing each other, so you pinch the tool out from both sides (the classic
 * Gridfinity grip). Each scoop is a cylinder whose axis is perpendicular to its wall and centred
 * on the rim → a clean half-round cut; the outer envelope is preserved.
 *
 * Default position is centred along the length; `positionMm` slides the pinch along it. No-op
 * when disabled or when the wall is too short; the radius is clamped to stay above the feet.
 */
export function cutGripNotches(bin: Shape3D, params: BinParams, notch: NotchConfig): Shape3D {
  if (!notch.enabled) return bin;

  const { width: W, depth: D } = binDimensions(params);
  const rimZ = params.heightUnits * HEIGHT_UNIT_MM + TOP_RISE;

  // Cut into the two longer opposing walls; the pinch slides along that long axis.
  const longIsY = D >= W;
  const wallLen = longIsY ? D : W; // length of the walls we cut into
  const span = longIsY ? W : D; // distance between the two opposing walls

  const r = Math.max(3, Math.min(notch.radiusMm, rimZ - 2, wallLen / 2 - 4));
  if (wallLen < 2 * r + 8) return bin; // too short to place a scoop sensibly

  // Position along the long axis (0 = centred), clamped so the scoop stays on the wall.
  const limit = Math.max(0, wallLen / 2 - r - 2);
  const pos = Math.max(-limit, Math.min(notch.positionMm, limit));
  const len = 2 * r + 4; // cylinder length: spans the outer face inward, carving the rim

  let out = bin;
  for (const sign of [-1, 1]) {
    // `sign` picks one of the two opposing walls; the scoop axis points inward.
    const cutter = longIsY
      ? makeCylinder(r, len, [sign * (span / 2 + len / 2), pos, rimZ], [-sign, 0, 0])
      : makeCylinder(r, len, [pos, sign * (span / 2 + len / 2), rimZ], [0, -sign, 0]);
    out = out.cut(cutter);
  }
  return out;
}
