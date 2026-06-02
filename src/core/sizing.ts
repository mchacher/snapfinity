import { assertNonNegative, assertPositive } from './guards';

/** Gridfinity height increment, in mm. */
export const HEIGHT_UNIT_MM = 7;

/**
 * Outer→inner reduction used when auto-sizing: a pocket of width W needs an outer footprint of
 * `W + BIN_INNER_MARGIN_MM` so it fits the usable interior, not the hors-tout grid. Accounts
 * for the inter-bin gap (CLEARANCE 0.5) + a wall on each side (~WALL 1.2) — see `cad/bin.ts`.
 */
export const BIN_INNER_MARGIN_MM = 0.5 + 2 * 1.2;

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
 * Grid footprint for a pocket of the given mm size: the pocket must fit the bin's **usable
 * interior**, so the outer grid is sized for `dim + BIN_INNER_MARGIN_MM` (not the bare dim).
 * Returns `null` for an empty footprint (so the UI keeps the previous size).
 */
export function gridForFootprint(widthMm: number, depthMm: number, pitchMm: number): GridFootprint | null {
  if (widthMm <= 0 || depthMm <= 0) return null;
  return gridFootprint(widthMm + BIN_INNER_MARGIN_MM, depthMm + BIN_INNER_MARGIN_MM, pitchMm);
}

/** Number of 7 mm height units a depth needs (ceil, minimum 1). */
export function heightUnits(heightMm: number): number {
  assertNonNegative('heightMm', heightMm);
  return Math.max(1, Math.ceil(heightMm / HEIGHT_UNIT_MM));
}
