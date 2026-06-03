import cv from '@techstark/opencv-js';
import type { Mat } from './cv';

// The pure selector + its type live in `segment-mode` (no WASM); re-export for convenience.
export { chooseSegmentMode, type SegmentMode } from './segment-mode';

/**
 * Edge-silhouette mask for **transparent / reflective** objects that u2netp (saliency) misses:
 * clear plastic on a clean background reads as background to the model, but its **edges**
 * (refraction outlines, caps, metal) stand out against the flat background. Pipeline at the
 * détourage working resolution: blur → Canny → dilate → morphological close → fill the contours.
 * Returns a filled 0/255 `CV_8UC1` Mat (ww×wh) — the caller cleans (token-out + largest blob) and
 * **must `.delete()`** it. Requires opencv ready. Validated in `tools/cv/edge-proto.ts`.
 *
 * Note: only reliable on a **clean/uniform background** — wood grain etc. produces edges
 * everywhere and the silhouette explodes (the Auto selector guards against picking it there).
 */
export function edgeMask(imageData: ImageData, ww: number, wh: number): Mat {
  const src = cv.matFromImageData(imageData);
  const small = new cv.Mat();
  cv.resize(src, small, new cv.Size(ww, wh), 0, 0, cv.INTER_AREA);
  src.delete();

  const gray = new cv.Mat();
  cv.cvtColor(small, gray, cv.COLOR_RGBA2GRAY);
  small.delete();

  // Flatten illumination (divide-by-blur) so **cast shadows** don't produce edges that the close
  // step would enclose and fill. A heavy blur estimates the low-frequency background (lighting +
  // shadows); dividing normalises the shaded background toward white while the object's
  // high-frequency edges survive — so we keep the object outline but lose the soft shadow rim.
  const bg = new cv.Mat();
  cv.GaussianBlur(gray, bg, new cv.Size(0, 0), Math.min(ww, wh) / 8);
  cv.divide(gray, bg, gray, 255); // saturate(gray * 255 / bg)
  bg.delete();
  cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

  const edges = new cv.Mat();
  cv.Canny(gray, edges, 30, 90);
  gray.delete();

  // thicken, then close so the object's broken edges merge into one solid silhouette
  cv.dilate(edges, edges, cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3)));
  const k = Math.max(9, Math.round(Math.min(ww, wh) * 0.035)); // close kernel scales with size
  const closed = new cv.Mat();
  cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k)));
  edges.delete();

  // fill the closed contours → solid blobs
  const cnts = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(closed, cnts, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  closed.delete();
  hierarchy.delete();
  const filled = cv.Mat.zeros(wh, ww, cv.CV_8UC1);
  for (let i = 0; i < cnts.size(); i += 1) cv.drawContours(filled, cnts, i, new cv.Scalar(255), -1);
  cnts.delete();
  return filled;
}
