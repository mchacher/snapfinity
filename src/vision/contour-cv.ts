import cv from '@techstark/opencv-js';
import type { Mat } from './cv';
import type { Point2D } from '../core/offset';

/**
 * Largest external contour of a binary mask as a polygon of full-res pixels (outer outline
 * only — interior holes are ignored, decisions #13). Uses opencv.js `findContours`, which may
 * modify the source Mat, so call it on a mask you're done reading. Returns `[]` for an empty
 * mask. Not unit-testable under Vitest (cv WASM) — exercised by the real photo + verify path.
 */
export function outerContour(mask: Mat): Point2D[] {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let best: Mat | null = null;
  let bestArea = 0;
  for (let i = 0; i < contours.size(); i += 1) {
    const c = contours.get(i);
    const area = cv.contourArea(c);
    if (area > bestArea) {
      best?.delete();
      bestArea = area;
      best = c;
    } else {
      c.delete();
    }
  }

  const points: Point2D[] = [];
  if (best) {
    const d = best.data32S;
    for (let i = 0; i < d.length; i += 2) points.push([d[i], d[i + 1]]);
    best.delete();
  }
  contours.delete();
  hierarchy.delete();
  return points;
}
