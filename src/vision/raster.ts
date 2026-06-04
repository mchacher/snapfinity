import type { Point2D } from '../core/offset';
import type { DerivedMask } from './analyze';

/** Match `deriveMask`'s working-resolution cap so the manual mask is the same shape as an auto one. */
const WORK_MAX = 1024;

/**
 * Turn a hand-traced (lasso) ring into a `DerivedMask` — a filled binary mask at working resolution
 * plus the outline (full-res px). This lets a **manual** selection feed the exact same pipeline as
 * an automatic one, so every adjust tool (brush on the mask, points / lissage / redresser on the
 * contour) works after a lasso. Pure canvas (no opencv/onnx), so it's safe to import anywhere.
 */
export function maskFromRing(ring: Point2D[], fullW: number, fullH: number): DerivedMask {
  const s = Math.min(1, WORK_MAX / Math.max(fullW, fullH));
  const ww = Math.max(1, Math.round(fullW * s));
  const wh = Math.max(1, Math.round(fullH * s));

  const canvas = document.createElement('canvas');
  canvas.width = ww;
  canvas.height = wh;
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(ww * wh);
  if (ctx && ring.length >= 3) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ring.forEach(([x, y], i) => {
      const px = x * s;
      const py = y * s;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    const px = ctx.getImageData(0, 0, ww, wh).data;
    for (let i = 0; i < data.length; i += 1) data[i] = px[i * 4] > 127 ? 255 : 0;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return {
    mask: { data, width: ww, height: wh },
    objectBBoxPx: ring.length >= 3 ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null,
    outline: ring.map(([x, y]) => [x, y] as Point2D),
  };
}
