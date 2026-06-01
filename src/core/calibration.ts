import { assertNonNegative, assertPositive } from './guards';

/** token 2.0 v4 nominal outer diameter (radius 38.1 from the STEP). */
export const TOKEN_DIAMETER_MM = 76.2;

/**
 * Scale in millimetres per pixel, derived from the calibration token's measured
 * pixel diameter and its known real diameter.
 *
 * @param tokenDiameterPx token diameter measured in the photo, in pixels
 * @param tokenDiameterMm real token diameter in mm (default: nominal OD; pass a
 *   caliper-measured value for best accuracy on the printed token)
 */
export function mmPerPx(tokenDiameterPx: number, tokenDiameterMm: number = TOKEN_DIAMETER_MM): number {
  assertPositive('tokenDiameterPx', tokenDiameterPx);
  assertPositive('tokenDiameterMm', tokenDiameterMm);
  return tokenDiameterMm / tokenDiameterPx;
}

/** Convert a pixel length to millimetres using a mm-per-pixel scale. */
export function pxToMm(px: number, scaleMmPerPx: number): number {
  assertNonNegative('px', px);
  assertPositive('scaleMmPerPx', scaleMmPerPx);
  return px * scaleMmPerPx;
}
