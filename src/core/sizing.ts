import { assertNonNegative, assertPositive } from './guards';

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

/** Number of 7 mm height units a depth needs (ceil, minimum 1). */
export function heightUnits(heightMm: number): number {
  assertNonNegative('heightMm', heightMm);
  return Math.max(1, Math.ceil(heightMm / HEIGHT_UNIT_MM));
}
