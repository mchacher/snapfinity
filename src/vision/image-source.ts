import cv from '@techstark/opencv-js';
import { loadOpenCv, type Mat } from './cv';
import { SEG_SIZE } from './segment';

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

/**
 * Browser counterpart of `cv-image-node.ts`: decode an uploaded `File`/`Blob` to the inputs
 * the pipeline needs. The image is decoded locally via canvas — it never leaves the browser.
 */
export async function loadPhoto(file: Blob): Promise<LoadedPhoto> {
  await loadOpenCv();
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, width, height);

  const src = cv.matFromImageData(imageData);
  const grayMat = new cv.Mat();
  cv.cvtColor(src, grayMat, cv.COLOR_RGBA2GRAY);

  const small = new cv.Mat();
  cv.resize(src, small, new cv.Size(SEG_SIZE, SEG_SIZE), 0, 0, cv.INTER_AREA);
  const seg320 = new Uint8ClampedArray(small.data);

  src.delete();
  small.delete();
  return { imageData, grayMat, seg320, width, height };
}
