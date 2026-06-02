import cv from '@techstark/opencv-js';
import type { Mat } from './cv';
import type { TokenCircle } from './mask';

/**
 * Isolate the tool in a binary mask (mutates it in place): zero the detected token region,
 * a light morphological open to drop speckle, then keep only the largest connected
 * component (the tool). Uses opencv.js — validated by the Node `verify:seg` script, which
 * shares this exact code (Vitest can't init the cv WASM, so this module is not unit-tested).
 */
export function cleanMask(mask: Mat, token: TokenCircle | null): void {
  if (token) {
    cv.circle(
      mask,
      new cv.Point(token.centerPx.x, token.centerPx.y),
      Math.round(token.radiusPx * 1.05),
      new cv.Scalar(0),
      -1,
    );
  }

  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
  cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);

  const labels = new cv.Mat();
  const stats = new cv.Mat();
  const centroids = new cv.Mat();
  const ncomp = cv.connectedComponentsWithStats(mask, labels, stats, centroids, 8, cv.CV_32S);
  let bestLabel = 0;
  let bestArea = 0;
  for (let l = 1; l < ncomp; l += 1) {
    const a = stats.intAt(l, cv.CC_STAT_AREA);
    if (a > bestArea) {
      bestArea = a;
      bestLabel = l;
    }
  }
  const lab = labels.data32S;
  for (let i = 0; i < mask.rows * mask.cols; i += 1) mask.data[i] = lab[i] === bestLabel ? 255 : 0;

  kernel.delete();
  labels.delete();
  stats.delete();
  centroids.delete();
}
