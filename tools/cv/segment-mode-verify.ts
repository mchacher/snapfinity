// Spec 027 oracle: run the REAL deriveMask (standard / edges / auto) on a photo and overlay the
// resulting contour, to confirm edge/auto recover transparent objects at the working resolution.
// Run: npx tsx tools/cv/segment-mode-verify.ts dataset/raw/screw_driver.jpeg
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as ort from 'onnxruntime-node';
import cv from '@techstark/opencv-js';
import { loadOpenCv } from '../../src/vision/cv';
import { detectToken, largestContour } from '../../src/vision/token';
import { grayFromJpegFile } from '../../src/vision/cv-image-node';
import { SEG_SIZE, rgbaToTensor } from '../../src/vision/segment';
import { deriveMask, type PhotoAnalysis } from '../../src/vision/analyze';
import type { SegmentMode } from '../../src/vision/segment-mode';

const require = createRequire(import.meta.url);
const jpeg = require('jpeg-js') as {
  decode: (b: Buffer, o?: { useTArray?: boolean; formatAsRGBA?: boolean }) => { width: number; height: number; data: Uint8Array };
  encode: (img: { data: Uint8Array; width: number; height: number }, q?: number) => { data: Uint8Array };
};

await loadOpenCv();
const session = await ort.InferenceSession.create('public/models/u2netp.onnx');
const refGray = grayFromJpegFile('public/token-ref.jpg');
const ref = largestContour(refGray);
refGray.delete();
mkdirSync('dataset/tmp', { recursive: true });

const photo = process.argv[2];
const raw = jpeg.decode(readFileSync(photo), { useTArray: true, formatAsRGBA: true });
const W = raw.width, H = raw.height;
const src = cv.matFromImageData({ data: raw.data, width: W, height: H });
const small = new cv.Mat();
cv.resize(src, small, new cv.Size(SEG_SIZE, SEG_SIZE), 0, 0, cv.INTER_AREA);
const tensor = rgbaToTensor(small.data);
const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', tensor, [1, 3, SEG_SIZE, SEG_SIZE]) });
const saliency = out[session.outputNames[0]].data as Float32Array;
small.delete();

const gray = new cv.Mat();
cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
const tok = detectToken(gray, ref);
gray.delete();

const a: PhotoAnalysis = {
  imageData: { data: raw.data, width: W, height: H } as unknown as ImageData,
  width: W,
  height: H,
  scaleMmPerPx: tok.found ? tok.scaleMmPerPx : null,
  token: tok.found ? { found: true, centerPx: tok.centerPx, radiusPx: tok.radiusPx, score: tok.score } : { found: false },
  saliency,
};

const name = photo.split('/').pop()!.replace(/\.[^.]+$/, '');
for (const mode of ['standard', 'edges', 'auto'] as SegmentMode[]) {
  const d = deriveMask(a, 0.5, mode);
  const cover = (100 * d.mask.data.reduce((n, v) => n + (v > 0 ? 1 : 0), 0)) / (d.mask.width * d.mask.height);
  // overlay the work-res mask (nearest-upscaled) in green
  const overlay = Buffer.from(src.data);
  const mw = d.mask.width, mh = d.mask.height;
  for (let y = 0; y < H; y += 1) {
    const my = Math.min(mh - 1, Math.floor((y / H) * mh));
    for (let x = 0; x < W; x += 1) {
      const mx = Math.min(mw - 1, Math.floor((x / W) * mw));
      if (d.mask.data[my * mw + mx] > 0) {
        const i = (y * W + x) * 4;
        overlay[i] = Math.round(overlay[i] * 0.35);
        overlay[i + 1] = Math.min(255, Math.round(overlay[i + 1] * 0.35 + 160));
        overlay[i + 2] = Math.round(overlay[i + 2] * 0.35);
      }
    }
  }
  const file = `dataset/tmp/seg27_${name}_${mode}.jpg`;
  writeFileSync(file, jpeg.encode({ data: overlay, width: W, height: H }, 80).data);
  console.log(`${name} ${mode.padEnd(9)} cover=${cover.toFixed(1)}%  outline=${d.outline.length}pts -> ${file}`);
}
