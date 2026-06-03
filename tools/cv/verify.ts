// Vision verification (it 010): run token detection on the whole dataset and report.
// Run: `npm run verify:vision`. opencv.js can't init under vitest (WASM), so this tsx
// script — importing the REAL module — is the vision check, alongside the overlay images.
import { readdirSync } from 'node:fs';
import { loadOpenCv, type Mat } from '../../src/vision/cv';
import { detectToken, largestContour } from '../../src/vision/token';
import { grayFromJpegFile } from '../../src/vision/cv-image-node';

await loadOpenCv();

const refGray = grayFromJpegFile('public/token-ref.jpg');
const ref: Mat = largestContour(refGray);
refGray.delete();

const photos = readdirSync('dataset/raw')
  .filter((f) => /\.jpe?g$/i.test(f))
  .sort()
  .map((f) => `dataset/raw/${f}`);

let pass = 0;
for (const photo of photos) {
  try {
    const gray = grayFromJpegFile(photo);
    const d = detectToken(gray, ref);
    gray.delete();
    const ok = d.found && d.scaleMmPerPx > 0.05 && d.scaleMmPerPx < 0.6;
    if (ok) pass += 1;
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${photo.replace('dataset/raw/', '').padEnd(28)} score=${d.score.toFixed(3)} scale=${d.scaleMmPerPx.toFixed(4)} r=${d.radiusPx.toFixed(0)}`,
    );
  } catch (err) {
    console.log(`ERR   ${photo}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
console.log(`\n${pass}/${photos.length} detected (${Math.round((100 * pass) / photos.length)}%)`);
