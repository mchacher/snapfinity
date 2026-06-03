import cv from '@techstark/opencv-js';
import { loadOpenCv, type Mat } from './cv';
import { SEG_SIZE } from './segment';
import type { CropRect } from './photo-transform';

export interface LoadedPhoto {
  /** Full-resolution RGBA pixels (for the overlay + bbox). */
  imageData: ImageData;
  /** Full-resolution gray Mat for token detection — caller must `.delete()` it. */
  grayMat: Mat;
  /** SEG_SIZE×SEG_SIZE RGBA buffer for u2netp (INTER_AREA downscale, like verify:seg). */
  seg320: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Decode a `File`/`Blob` to full-resolution RGBA pixels via a canvas. Stays in the browser. */
export async function decodePhoto(file: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, width, height);
}

/**
 * Pre-process the photo: **rotate** by `straightenDeg` (about the centre) then **crop** to
 * `cropRect` (normalised). The canvas is filled white first so the empty corners a rotation
 * leaves are white (not black) — otherwise the dark-token threshold would catch them. Returns
 * the transformed RGBA pixels; identity when there's nothing to do.
 */
export function transformPhoto(src: ImageData, straightenDeg: number, cropRect: CropRect | null): ImageData {
  if (straightenDeg === 0 && !cropRect) return src;
  const sw = src.width;
  const sh = src.height;

  // Pure crop (no rotation): slice the pixel rows directly — no canvas round-trip, no full-res
  // redraw. This makes a crop show **instantly** (a few ms) instead of a ~200–400 ms canvas pass
  // on a big phone photo. Produces the exact same pixels as the canvas crop below.
  if (straightenDeg === 0 && cropRect) {
    const cx = Math.max(0, Math.min(sw - 1, Math.round(cropRect.x * sw)));
    const cy = Math.max(0, Math.min(sh - 1, Math.round(cropRect.y * sh)));
    const cw = Math.max(1, Math.min(sw - cx, Math.round(cropRect.w * sw)));
    const ch = Math.max(1, Math.min(sh - cy, Math.round(cropRect.h * sh)));
    const out = new ImageData(cw, ch);
    for (let y = 0; y < ch; y += 1) {
      const start = ((cy + y) * sw + cx) * 4;
      out.data.set(src.data.subarray(start, start + cw * 4), y * cw * 4);
    }
    return out;
  }

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = sw;
  srcCanvas.height = sh;
  srcCanvas.getContext('2d')?.putImageData(src, 0, 0);

  // Size the rotated canvas to the rotated bounding box so nothing is clipped — works for small
  // straightening angles AND quarter-turns (portrait ↔ landscape).
  const rad = (straightenDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const bw = Math.max(1, Math.round(sw * cos + sh * sin));
  const bh = Math.max(1, Math.round(sw * sin + sh * cos));

  const rot = document.createElement('canvas');
  rot.width = bw;
  rot.height = bh;
  const rctx = rot.getContext('2d');
  if (!rctx) throw new Error('2D canvas context unavailable');
  rctx.fillStyle = '#ffffff';
  rctx.fillRect(0, 0, bw, bh);
  rctx.translate(bw / 2, bh / 2);
  rctx.rotate(rad);
  rctx.drawImage(srcCanvas, -sw / 2, -sh / 2);

  const cx = cropRect ? Math.round(cropRect.x * bw) : 0;
  const cy = cropRect ? Math.round(cropRect.y * bh) : 0;
  const cw = cropRect ? Math.max(1, Math.round(cropRect.w * bw)) : bw;
  const ch = cropRect ? Math.max(1, Math.round(cropRect.h * bh)) : bh;
  return rctx.getImageData(cx, cy, cw, ch);
}

/** Build the opencv inputs (gray Mat + 320² seg buffer) from decoded RGBA pixels. */
export function cvInputsFromImageData(imageData: ImageData): {
  grayMat: Mat;
  seg320: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const src = cv.matFromImageData(imageData);
  const grayMat = new cv.Mat();
  cv.cvtColor(src, grayMat, cv.COLOR_RGBA2GRAY);
  const small = new cv.Mat();
  cv.resize(src, small, new cv.Size(SEG_SIZE, SEG_SIZE), 0, 0, cv.INTER_AREA);
  const seg320 = new Uint8ClampedArray(small.data);
  src.delete();
  small.delete();
  return { grayMat, seg320, width: imageData.width, height: imageData.height };
}

/**
 * Browser counterpart of `cv-image-node.ts`: decode an uploaded `File`/`Blob` to the inputs the
 * pipeline needs (no framing transform — used for the reference token). The image is decoded
 * locally via canvas — it never leaves the browser.
 */
export async function loadPhoto(file: Blob): Promise<LoadedPhoto> {
  await loadOpenCv();
  const imageData = await decodePhoto(file);
  const { grayMat, seg320, width, height } = cvInputsFromImageData(imageData);
  return { imageData, grayMat, seg320, width, height };
}
