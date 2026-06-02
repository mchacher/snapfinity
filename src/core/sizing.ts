import { assertNonNegative, assertPositive } from './guards';
import { pxToMm } from './calibration';

/** Gridfinity height increment, in mm. */
export const HEIGHT_UNIT_MM = 7;

/** Supported grid pitches, in mm. Pitches are NOT cross-compatible. */
export const PITCH = { standard: 42, compact: 36 } as const;

export interface GridFootprint {
  cols: number;
  rows: number;
}

/** Number of grid cells a length spans at a given pitch (ceil, minimum 1). */
export function unitsForLength(lengthMm: number, pitchMm: number): number {
  assertPositive('pitchMm', pitchMm);
  assertNonNegative('lengthMm', lengthMm);
  return Math.max(1, Math.ceil(lengthMm / pitchMm));
}

/** Grid footprint (cols × rows) a width/depth bounding box needs at a given pitch. */
export function gridFootprint(widthMm: number, depthMm: number, pitchMm: number): GridFootprint {
  return {
    cols: unitsForLength(widthMm, pitchMm),
    rows: unitsForLength(depthMm, pitchMm),
  };
}

/**
 * Grid footprint for an object's pixel bounding box, given the calibration scale.
 * Returns `null` when there is no usable scale or the box is empty (so the UI keeps the
 * previous size instead of snapping to a bogus 0×0).
 */
export function footprintFromBBox(
  bboxPx: { w: number; h: number },
  scaleMmPerPx: number | null,
  pitchMm: number,
): GridFootprint | null {
  if (scaleMmPerPx === null || scaleMmPerPx <= 0) return null;
  if (bboxPx.w <= 0 || bboxPx.h <= 0) return null;
  return gridFootprint(pxToMm(bboxPx.w, scaleMmPerPx), pxToMm(bboxPx.h, scaleMmPerPx), pitchMm);
}

/** Number of 7 mm height units a depth needs (ceil, minimum 1). */
export function heightUnits(heightMm: number): number {
  assertNonNegative('heightMm', heightMm);
  return Math.max(1, Math.ceil(heightMm / HEIGHT_UNIT_MM));
}
