import { draw, type Shape3D, type Sketch } from 'replicad';
import { HEIGHT_UNIT_MM } from '../core/sizing';
import { simplifyFootprintMm } from '../core/footprint';
import { makeBin, type BinParams } from './bin';
import type { Point2D } from '../core/offset';

export interface PocketOptions {
  /** Pocket depth in mm. Default: the full body depth minus the floor. */
  depthMm?: number;
  /** Floor thickness left under the pocket, in mm (default 1). */
  floorMm?: number;
}

/**
 * Build a Gridfinity bin with a cavity shaped like `footprint` (a closed polygon in mm,
 * centred on the origin) cut from the top — the tool nests in this pocket.
 *
 * The bin body is solid (no rectangular shell); the footprint is what hollows it.
 */
export function makeBinWithPocket(
  params: BinParams,
  footprint: Point2D[],
  options: PocketOptions = {},
): Shape3D {
  if (footprint.length < 3) {
    throw new Error(`footprint needs at least 3 points, got ${footprint.length}`);
  }
  const { floorMm = 1 } = options;
  const topZ = params.heightUnits * HEIGHT_UNIT_MM;
  const maxDepth = topZ - floorMm;
  // Clamp to keep a floor: a requested depth ≥ the body would cut through the bottom.
  const depthMm = Math.min(options.depthMm ?? maxDepth, maxDepth);
  if (depthMm <= 0) {
    throw new Error(`pocket depth must be > 0, got ${depthMm}`);
  }

  const bin = makeBin({ ...params, hollow: false });

  // Decimate the ring before tracing it: the contour reaches here with hundreds of
  // near-collinear points (clipper offset + Chaikin), each an extra edge the boolean must
  // process. Dropping sub-print-resolution points keeps the shape but cuts the edge count.
  const ring = simplifyFootprintMm(footprint);
  let pen = draw(ring[0]);
  for (let i = 1; i < ring.length; i++) {
    pen = pen.lineTo(ring[i]);
  }
  const pocket = (pen.close().sketchOnPlane('XY', topZ) as Sketch).extrude(-depthMm) as Shape3D;

  return bin.cut(pocket);
}
