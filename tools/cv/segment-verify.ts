// Segmentation verification (it 011): run u2netp on photos, isolate the tool (mask minus the
// token region from detection), write overlays for visual review. Run: `npm run verify:seg <photos…>`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as ort from 'onnxruntime-node';
import cv from '@techstark/opencv-js';
import { loadOpenCv } from '../../src/vision/cv';
import { detectToken, largestContour } from '../../src/vision/token';
import { cleanMask } from '../../src/vision/isolate';
import { outerContour } from '../../src/vision/contour-cv';
import { smoothContour } from '../../src/core/contour';
import { offsetPolygon, type Point2D } from '../../src/core/offset';
import { grayFromJpegFile } from '../../src/vision/cv-image-node';
import { SEG_SIZE, rgbaToTensor, saliencyToMask } from '../../src/vision/segment';

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
const photos = process.argv.slice(2);
for (const photo of photos) {
  const raw = jpeg.decode(readFileSync(photo), { useTArray: true, formatAsRGBA: true });
  const src = cv.matFromImageData({ data: raw.data, width: raw.width, height: raw.height });

  // resize → tensor → u2netp → saliency → mask(320)
  const small = new cv.Mat();
  cv.resize(src, small, new cv.Size(SEG_SIZE, SEG_SIZE), 0, 0, cv.INTER_AREA);
  const tensor = rgbaToTensor(small.data);
  const feeds = { [session.inputNames[0]]: new ort.Tensor('float32', tensor, [1, 3, SEG_SIZE, SEG_SIZE]) };
  const out = await session.run(feeds);
  const saliency = out[session.outputNames[0]].data as Float32Array;
  const mask320 = saliencyToMask(saliency, 0.5);

  // upscale mask to full size
  const maskSmall = cv.matFromArray(SEG_SIZE, SEG_SIZE, cv.CV_8UC1, Array.from(mask320));
  const mask = new cv.Mat();
  cv.resize(maskSmall, mask, new cv.Size(raw.width, raw.height), 0, 0, cv.INTER_NEAREST);

  // isolate the tool: exclude the detected token region, then morph-open + keep largest blob
  // (shared with the browser pipeline — src/vision/isolate.ts)
  const gray = grayFromJpegFile(photo);
  const tok = detectToken(gray, ref);
  gray.delete();
  cleanMask(mask, tok.found ? { centerPx: tok.centerPx, radiusPx: tok.radiusPx } : null);

  // overlay: green tint where mask, red token circle
  const overlay = Buffer.from(src.data);
  for (let i = 0; i < raw.width * raw.height; i += 1) {
    if (mask.data[i] > 0) {
      overlay[i * 4] = Math.round(overlay[i * 4] * 0.35);
      overlay[i * 4 + 1] = Math.min(255, Math.round(overlay[i * 4 + 1] * 0.35 + 160));
      overlay[i * 4 + 2] = Math.round(overlay[i * 4 + 2] * 0.35);
    }
  }
  const over = cv.matFromImageData({ data: overlay, width: raw.width, height: raw.height });
  if (tok.found) cv.circle(over, new cv.Point(tok.centerPx.x, tok.centerPx.y), Math.round(tok.radiusPx), new cv.Scalar(0, 200, 255, 255), 6);

  // contour (013): outer outline → smoothed (solid accent) + 1 mm clearance offset (dashed amber)
  const drawRing = (ring: Point2D[], color: InstanceType<typeof cv.Scalar>, thickness: number) => {
    for (let i = 0; i < ring.length; i += 1) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      cv.line(over, new cv.Point(Math.round(a[0]), Math.round(a[1])), new cv.Point(Math.round(b[0]), Math.round(b[1])), color, thickness);
    }
  };
  const smoothed = smoothContour(outerContour(mask), 0.3); // mutates mask — done reading it
  if (smoothed.length >= 3) {
    if (tok.found) {
      const off = offsetPolygon(smoothed, 1.0 / tok.scaleMmPerPx);
      if (off.length >= 3) drawRing(off, new cv.Scalar(245, 158, 11, 255), 3);
    }
    drawRing(smoothed, new cv.Scalar(47, 120, 212, 255), 4);
  }

  const name = photo.split('/').pop()!.replace(/\.\w+$/, '');
  writeFileSync(`dataset/tmp/seg_${name}.jpg`, jpeg.encode({ data: Buffer.from(over.data), width: raw.width, height: raw.height }, 85).data);
  console.log(`${name}: token=${tok.found ? 'yes' : 'NO'} -> dataset/tmp/seg_${name}.jpg`);

  src.delete();
  small.delete();
  maskSmall.delete();
  mask.delete();
  over.delete();
}
console.log('OK');
