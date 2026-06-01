import { drawRoundedRectangle, type Shape3D } from 'replicad';
import { HEIGHT_UNIT_MM } from '../core/sizing';

/**
 * Parametric Gridfinity bin, modelled directly in replicad (no Python bake).
 *
 * Iteration 2 targets **correct outer dimensions** with a recognisable foot and a hollow
 * pocket. Exact Gridfinity profile compliance (precise chamfer stack, magnet holes) is a
 * later refinement — these constants are deliberately approximate for the base height.
 */

/** Gridfinity clearance: a bin's outer size is `n * pitch - gap`. */
export const BIN_GAP_MM = 0.5;
/** Outer corner radius. */
export const BIN_CORNER_RADIUS_MM = 3.75;
/** Foot/base height (approximate — refined in a later iteration). */
export const BIN_BASE_HEIGHT_MM = 4.75;
/** Wall thickness. */
export const BIN_WALL_MM = 1.2;
/** Floor thickness. */
export const BIN_FLOOR_MM = 1.0;

export interface BinParams {
  cols: number;
  rows: number;
  heightUnits: number;
  /** Grid pitch in mm (default 42). */
  pitchMm?: number;
}

export interface BinDimensions {
  width: number;
  depth: number;
  height: number;
}

/** Outer dimensions of a bin, in mm. */
export function binDimensions({ cols, rows, heightUnits, pitchMm = 42 }: BinParams): BinDimensions {
  return {
    width: cols * pitchMm - BIN_GAP_MM,
    depth: rows * pitchMm - BIN_GAP_MM,
    height: BIN_BASE_HEIGHT_MM + heightUnits * HEIGHT_UNIT_MM,
  };
}

/** Build the bin solid (rounded body + foot chamfer + hollow pocket). */
export function makeBin(params: BinParams) {
  const { width, depth, height } = binDimensions(params);

  let body = drawRoundedRectangle(width, depth, BIN_CORNER_RADIUS_MM)
    .sketchOnPlane('XY')
    .extrude(height) as Shape3D;

  // Foot: chamfer the bottom outline so the base narrows like a Gridfinity foot.
  body = body.chamfer(BIN_BASE_HEIGHT_MM * 0.6, (e) => e.inPlane('XY', 0));

  // Hollow pocket from the floor up.
  const cavity = drawRoundedRectangle(
    width - 2 * BIN_WALL_MM,
    depth - 2 * BIN_WALL_MM,
    BIN_CORNER_RADIUS_MM,
  )
    .sketchOnPlane('XY', BIN_FLOOR_MM)
    .extrude(height) as Shape3D;

  return body.cut(cavity);
}
