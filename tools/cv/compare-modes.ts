// De-risk the AUTO selector (spec 027): for each photo, compare the cleaned u2netp mask area to
// the cleaned edge-silhouette area. Transparent objects should give a LOW ratio (u2netp failed),
// opaque ones a HIGH ratio. Run: npx tsx tools/cv/compare-modes.ts <photos…>
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as ort from 'onnxruntime-node';
import cv from '@techstark/opencv-js';
import { loadOpenCv } from '../../src/vision/cv';
import { detectToken, largestContour } from '../../src/vision/token';
import { cleanMask } from '../../src/vision/isolate';
import { grayFromJpegFile } from '../../src/vision/cv-image-node';
import { SEG_SIZE, rgbaToTensor, saliencyToMask } from '../../src/vision/segment';

const require = createRequire(import.meta.url);
const jpeg = require('jpeg-js') as { decode: (b: Buffer, o?: { useTArray?: boolean; formatAsRGBA?: boolean }) => { width: number; height: number; data: Uint8Array } };

await loadOpenCv();
const session = await ort.InferenceSession.create('public/models/u2netp.onnx');
const refGray = grayFromJpegFile('public/token-ref.jpg');
const ref = largestContour(refGray);
refGray.delete();

function area(mask: cv.Mat): number { return cv.countNonZero(mask); }

/** Edge silhouette mask (full res), same pipeline as the proto. */
function edgeMask(gray: cv.Mat, W: number, H: number): cv.Mat {
  const blur = new cv.Mat();
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
  const edges = new cv.Mat();
  cv.Canny(blur, edges, 30, 90);
  cv.dilate(edges, edges, cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3)));
  const closed = new cv.Mat();
  cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(25, 25)));
  const cnts = new cv.MatVector();
  const hi = new cv.Mat();
  cv.findContours(closed, cnts, hi, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  const filled = cv.Mat.zeros(H, W, cv.CV_8UC1);
  for (let i = 0; i < cnts.size(); i += 1) cv.drawContours(filled, cnts, i, new cv.Scalar(255), -1);
  blur.delete(); edges.delete(); closed.delete(); cnts.delete(); hi.delete();
  return filled;
}

for (const photo of process.argv.slice(2)) {
  const raw = jpeg.decode(readFileSync(photo), { useTArray: true, formatAsRGBA: true });
  const W = raw.width, H = raw.height;
  const src = cv.matFromImageData({ data: raw.data, width: W, height: H });
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  const tok = detectToken(gray, ref);
  const tc = tok.found && tok.centerPx && tok.radiusPx ? { centerPx: tok.centerPx, radiusPx: tok.radiusPx } : null;

  // u2netp cleaned mask
  const small = new cv.Mat();
  cv.resize(src, small, new cv.Size(SEG_SIZE, SEG_SIZE), 0, 0, cv.INTER_AREA);
  const tensor = rgbaToTensor(small.data);
  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', tensor, [1, 3, SEG_SIZE, SEG_SIZE]) });
  const sal = out[session.outputNames[0]].data as Float32Array;
  const m320 = saliencyToMask(sal, 0.5);
  const ms = cv.matFromArray(SEG_SIZE, SEG_SIZE, cv.CV_8UC1, Array.from(m320));
  const uMask = new cv.Mat();
  cv.resize(ms, uMask, new cv.Size(W, H), 0, 0, cv.INTER_NEAREST);
  cleanMask(uMask, tc);
  const uArea = area(uMask);

  // edge cleaned mask
  const eMask = edgeMask(gray, W, H);
  cleanMask(eMask, tc);
  const eArea = area(eMask);

  const ratio = eArea > 0 ? uArea / eArea : 1;
  const total = W * H;
  console.log(
    `${photo.split('/').pop()!.padEnd(26)} u2netp=${(100 * uArea / total).toFixed(2)}%  edge=${(100 * eArea / total).toFixed(2)}%  ratio=${ratio.toFixed(2)}  -> ${ratio < 0.4 ? 'EDGES' : 'u2netp'}`,
  );
  src.delete(); gray.delete(); small.delete(); ms.delete(); uMask.delete(); eMask.delete();
}
