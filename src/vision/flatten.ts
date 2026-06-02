import cv from '@techstark/opencv-js';

/**
 * Background flattening (divide-by-blur) of an RGBA buffer — the classic document/scan trick
 * to kill soft shadows on a light background. A heavy Gaussian blur estimates the low-frequency
 * background (illumination + cast shadows); dividing the image by it normalises the lit-but-
 * shaded background toward white while the (locally darker) object stays dark. `strength`
 * (0…1) blends between the original and the fully-flattened image, so the effect is dosable.
 * Applied to the small model input before u2netp, so it's cheap. Uses opencv.js — validated
 * visually.
 */
export function flattenRgba(
  rgba: Uint8Array | Uint8ClampedArray,
  size: number,
  strength: number,
): Uint8ClampedArray {
  const s = Math.max(0, Math.min(1, strength));
  const src = cv.matFromImageData({ data: new Uint8ClampedArray(rgba), width: size, height: size });
  const rgb = new cv.Mat();
  cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);

  const bg = new cv.Mat();
  cv.GaussianBlur(rgb, bg, new cv.Size(0, 0), size / 8);
  const flat = new cv.Mat();
  cv.divide(rgb, bg, flat, 255); // flat = saturate(rgb * 255 / bg)
  const blended = new cv.Mat();
  cv.addWeighted(rgb, 1 - s, flat, s, 0, blended); // dose the effect

  const out = new cv.Mat();
  cv.cvtColor(blended, out, cv.COLOR_RGB2RGBA);
  const result = new Uint8ClampedArray(out.data);

  src.delete();
  rgb.delete();
  bg.delete();
  flat.delete();
  blended.delete();
  out.delete();
  return result;
}
