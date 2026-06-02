import cv from '@techstark/opencv-js';
import type { Mat } from './cv';
import { loadPhoto } from './image-source';
import { TOKEN_OD_MM, detectToken, largestContour } from './token';
import { SEG_SIZE, saliencyToMask } from './segment';
import { runSaliency } from './seg-runtime';
import { cleanMask } from './isolate';
import { outerContour } from './contour-cv';
import { maskBBox, type BBox, type TokenCircle } from './mask';
import type { Point2D } from '../core/offset';

export interface PhotoAnalysis {
  /** Full-resolution photo pixels (so the overlay draws without re-decoding). */
  imageData: ImageData;
  width: number;
  height: number;
  /** Calibration scale, or `null` when no token was found. */
  scaleMmPerPx: number | null;
  token: { found: boolean } & Partial<TokenCircle> & { score?: number };
  /** Raw u2netp saliency map (SEG_SIZE²) — the mask is re-derived from it at any threshold. */
  saliency: Float32Array;
}

/** Mask-dependent results, re-derived from the saliency at the chosen detection threshold. */
export interface DerivedMask {
  /** Full-resolution binary mask of the isolated tool (0 / 255). */
  mask: { data: Uint8Array; width: number; height: number };
  objectBBoxPx: BBox | null;
  /** Outer contour of the tool (full-res px); `[]` when no object. */
  outline: Point2D[];
}

export interface AnalyzeOptions {
  tokenOdMm?: number;
}

let refPromise: Promise<Mat> | null = null;

/** Reference token contour (the 6-fold star), loaded once from the self-hosted image. */
function getRefContour(): Promise<Mat> {
  if (!refPromise) {
    refPromise = (async () => {
      const blob = await (await fetch(`${import.meta.env.BASE_URL}token-ref.jpg`)).blob();
      const { grayMat } = await loadPhoto(blob);
      const ref = largestContour(grayMat);
      grayMat.delete();
      return ref;
    })();
  }
  return refPromise;
}

/**
 * Full in-browser analysis of an uploaded photo: detect the token (scale), segment the
 * object (u2netp), isolate the tool, and derive the auto grid size. Everything runs locally;
 * the photo never leaves the browser.
 */
export async function analyzePhoto(file: Blob, options: AnalyzeOptions = {}): Promise<PhotoAnalysis> {
  const { tokenOdMm = TOKEN_OD_MM } = options;
  const ref = await getRefContour();
  const { imageData, grayMat, seg320, width, height } = await loadPhoto(file);

  const det = detectToken(grayMat, ref, { tokenOdMm });
  grayMat.delete();
  const scaleMmPerPx = det.found ? det.scaleMmPerPx : null;

  const saliency = await runSaliency(seg320);

  return {
    imageData,
    width,
    height,
    scaleMmPerPx,
    token: det.found
      ? { found: true, centerPx: det.centerPx, radiusPx: det.radiusPx, score: det.score }
      : { found: false },
    saliency,
  };
}

/**
 * Derive the isolated-tool mask + contour from the saliency at a given detection threshold.
 * Raising the threshold keeps only high-confidence foreground, which drops soft shadows.
 * Re-runs only the cheap post-processing (re-threshold + cv upscale/clean/contour) — never
 * the u2netp inference — so it's fast enough to drive a live slider. Requires opencv.js ready
 * (always true once `analyzePhoto` has run).
 */
export function deriveMask(a: PhotoAnalysis, threshold: number): DerivedMask {
  const tokenCircle: TokenCircle | null =
    a.token.found && a.token.centerPx && a.token.radiusPx
      ? { centerPx: a.token.centerPx, radiusPx: a.token.radiusPx }
      : null;

  const mask320 = saliencyToMask(a.saliency, threshold);
  const maskSmall = cv.matFromArray(SEG_SIZE, SEG_SIZE, cv.CV_8UC1, Array.from(mask320));
  const maskFull = new cv.Mat();
  cv.resize(maskSmall, maskFull, new cv.Size(a.width, a.height), 0, 0, cv.INTER_NEAREST);
  cleanMask(maskFull, tokenCircle);
  const maskData = new Uint8Array(maskFull.data);
  const outline = outerContour(maskFull); // may mutate maskFull — we're done reading it
  maskSmall.delete();
  maskFull.delete();

  return {
    mask: { data: maskData, width: a.width, height: a.height },
    objectBBoxPx: maskBBox(maskData, a.width, a.height),
    outline,
  };
}
