import cv from '@techstark/opencv-js';
import type { Mat } from './cv';

/** token 2.0 v4 nominal outer diameter (radius 38.1 from the STEP). */
export const TOKEN_OD_MM = 76.2;

export interface TokenDetection {
  /** A token-shaped contour was found below the score threshold. */
  found: boolean;
  /** Calibration scale (mm per pixel) from the token diameter. */
  scaleMmPerPx: number;
  centerPx: { x: number; y: number };
  radiusPx: number;
  /** matchShapes score against the reference (lower = better). */
  score: number;
}

export interface DetectOptions {
  tokenOdMm?: number;
  /** Minimum contour area as a fraction of the image area. */
  minAreaFraction?: number;
  /** matchShapes threshold below which a contour is accepted as the token. */
  maxScore?: number;
}

/**
 * Isolate the near-black token. It is much darker than any background (white paper or wood
 * grain), so a fixed dark cut is more robust than global Otsu — which, on textured wood,
 * leaks grain into the token contour and loosens the detected circle.
 */
function thresholded(gray: Mat, darkCut = 100): Mat {
  const blur = new cv.Mat();
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
  const thresh = new cv.Mat();
  cv.threshold(blur, thresh, darkCut, 255, cv.THRESH_BINARY_INV);
  blur.delete();
  return thresh;
}

/** Largest external contour of a gray image — used to build the reference token contour. */
export function largestContour(gray: Mat): Mat {
  const thresh = thresholded(gray);
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

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
  thresh.delete();
  contours.delete();
  hierarchy.delete();
  if (!best) throw new Error('no contour found in reference image');
  return best;
}

/**
 * Detect the calibration token in a gray image by shape-matching against a reference token
 * contour (the token is a distinctive 6-fold star — matchShapes is robust to it, where a
 * "most circular" heuristic fails). Returns the calibration scale from the token diameter.
 */
export function detectToken(gray: Mat, refContour: Mat, options: DetectOptions = {}): TokenDetection {
  const { tokenOdMm = TOKEN_OD_MM, minAreaFraction = 0.002, maxScore = 0.7 } = options;
  const thresh = thresholded(gray);
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const minArea = gray.cols * gray.rows * minAreaFraction;
  let best = { score: Infinity, radius: 0, x: 0, y: 0 };
  for (let i = 0; i < contours.size(); i += 1) {
    const c = contours.get(i);
    if (cv.contourArea(c) >= minArea) {
      const score = cv.matchShapes(c, refContour, cv.CONTOURS_MATCH_I1, 0);
      if (score < best.score) {
        const circle = cv.minEnclosingCircle(c);
        best = { score, radius: circle.radius, x: circle.center.x, y: circle.center.y };
      }
    }
    c.delete();
  }
  thresh.delete();
  contours.delete();
  hierarchy.delete();

  return {
    found: best.score <= maxScore && best.radius > 0,
    score: best.score,
    radiusPx: best.radius,
    centerPx: { x: best.x, y: best.y },
    scaleMmPerPx: best.radius > 0 ? tokenOdMm / (2 * best.radius) : 0,
  };
}
