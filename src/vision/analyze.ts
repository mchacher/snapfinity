import cv from '@techstark/opencv-js';
import type { Mat } from './cv';
import { loadPhoto } from './image-source';
import { TOKEN_OD_MM, detectToken, largestContour } from './token';
import { SEG_SIZE, adjustRgba, saliencyToMask } from './segment';
import { flattenRgba } from './flatten';
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
  /** Pre-inference background flattening (divide-by-blur) — removes soft shadows on light bg. */
  flatten?: boolean;
  /** Pre-inference brightness offset (washes light shadows toward white). */
  brightness?: number;
  /** Pre-inference contrast (classic factor formula). */
  contrast?: number;
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
interface DecodeCache {
  file: Blob;
  imageData: ImageData;
  seg320: Uint8ClampedArray;
  width: number;
  height: number;
  det: ReturnType<typeof detectToken>;
}

// One decoded photo at a time. Re-running for a brightness/contrast change reuses this so we
// don't re-decode the full-res image (Mat + canvas + ImageData ≈ tens of MB) every change —
// that tripled peak memory and crashed the tab. Only adjustRgba(seg320) + inference re-run.
let decodeCache: DecodeCache | null = null;

export async function analyzePhoto(file: Blob, options: AnalyzeOptions = {}): Promise<PhotoAnalysis> {
  const { tokenOdMm = TOKEN_OD_MM, flatten = false, brightness = 0, contrast = 0 } = options;

  if (decodeCache?.file !== file) {
    const ref = await getRefContour();
    const { imageData, grayMat, seg320, width, height } = await loadPhoto(file);
    // Token detection runs on the *original* gray (stable calibration, independent of the
    // brightness/contrast a user dials in for segmentation).
    const det = detectToken(grayMat, ref, { tokenOdMm });
    grayMat.delete();
    decodeCache = { file, imageData, seg320, width, height, det };
  }
  const c = decodeCache;

  // Pre-process the model input only (tiny 320² buffer): flatten the background to kill soft
  // shadows, then the optional brightness/contrast. The displayed photo is left untouched
  // (flatten would only wash it out); brightness/contrast are mirrored in the overlay.
  let segInput: Uint8ClampedArray = c.seg320;
  if (flatten) segInput = flattenRgba(segInput, SEG_SIZE);
  if (brightness !== 0 || contrast !== 0) segInput = adjustRgba(segInput, brightness, contrast);
  const saliency = await runSaliency(segInput);

  return {
    imageData: c.imageData,
    width: c.width,
    height: c.height,
    scaleMmPerPx: c.det.found ? c.det.scaleMmPerPx : null,
    token: c.det.found
      ? { found: true, centerPx: c.det.centerPx, radiusPx: c.det.radiusPx, score: c.det.score }
      : { found: false },
    saliency,
  };
}

/** Cap the cleanup/contour working resolution — full-res cv ops are far too heavy to run live. */
const WORK_MAX = 1024;

/**
 * Derive the isolated-tool mask + contour from the saliency at a given detection threshold.
 * Raising the threshold keeps only high-confidence foreground, which drops soft shadows.
 * Re-runs only the cheap post-processing (re-threshold + cv clean/contour) — never the u2netp
 * inference — and works at a **reduced resolution** (≤ WORK_MAX) so it's fast and light enough
 * to drive a live slider without churning full-res Mats. The mask is returned at the working
 * resolution; the outline + bbox are scaled back to full-res px. Requires opencv.js ready.
 */
export function deriveMask(a: PhotoAnalysis, threshold: number): DerivedMask {
  const s = Math.min(1, WORK_MAX / Math.max(a.width, a.height));
  const ww = Math.max(1, Math.round(a.width * s));
  const wh = Math.max(1, Math.round(a.height * s));
  const tokenCircle: TokenCircle | null =
    a.token.found && a.token.centerPx && a.token.radiusPx
      ? { centerPx: { x: a.token.centerPx.x * s, y: a.token.centerPx.y * s }, radiusPx: a.token.radiusPx * s }
      : null;

  const mask320 = saliencyToMask(a.saliency, threshold);
  const maskSmall = cv.matFromArray(SEG_SIZE, SEG_SIZE, cv.CV_8UC1, Array.from(mask320));
  const maskWork = new cv.Mat();
  cv.resize(maskSmall, maskWork, new cv.Size(ww, wh), 0, 0, cv.INTER_NEAREST);
  cleanMask(maskWork, tokenCircle);
  const maskData = new Uint8Array(maskWork.data);
  const outlineWork = outerContour(maskWork); // may mutate maskWork — we're done reading it
  maskSmall.delete();
  maskWork.delete();

  // scale the outline + bbox back up to full-res px (the mask stays at working resolution)
  const inv = 1 / s;
  const outline: Point2D[] = outlineWork.map(([x, y]) => [x * inv, y * inv]);
  const bbox = maskBBox(maskData, ww, wh);
  const objectBBoxPx = bbox
    ? { x: bbox.x * inv, y: bbox.y * inv, w: bbox.w * inv, h: bbox.h * inv }
    : null;

  return { mask: { data: maskData, width: ww, height: wh }, objectBBoxPx, outline };
}
