import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import cv from '@techstark/opencv-js';
import type { Mat } from './cv';

const require = createRequire(import.meta.url);
const jpeg = require('jpeg-js') as {
  decode: (
    data: Buffer,
    opts?: { useTArray?: boolean; formatAsRGBA?: boolean },
  ) => { width: number; height: number; data: Uint8Array };
};

/** Decode a JPEG file to a gray Mat (Node/test helper; the browser uses a canvas instead). */
export function grayFromJpegFile(path: string): Mat {
  const raw = jpeg.decode(readFileSync(path), { useTArray: true, formatAsRGBA: true });
  const src = cv.matFromImageData({ data: raw.data, width: raw.width, height: raw.height });
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  src.delete();
  return gray;
}
