import { useEffect, useRef } from 'react';
import type { PhotoAnalysis } from '../../vision/analyze';
import type { Point2D } from '../../core/offset';

/** Cap the rendered canvas so a 12 MP phone photo doesn't allocate a huge surface. */
const MAX_SIDE = 1024;

/** Stroke a closed ring of full-res points, scaled to the canvas. */
function drawRing(
  ctx: CanvasRenderingContext2D,
  ring: Point2D[],
  scale: number,
  stroke: string,
  width: number,
  dash: number[] = [],
) {
  if (ring.length < 2) return;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(ring[0][0] * scale, ring[0][1] * scale);
  for (let i = 1; i < ring.length; i += 1) ctx.lineTo(ring[i][0] * scale, ring[i][1] * scale);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draw the analysed photo with the vision overlay: green tint on the isolated tool mask,
 * a cyan token circle, and the object's bounding box — the in-app equivalent of the
 * `verify:seg` overlays, so detection + segmentation can be validated visually.
 */
export function PhotoOverlay({
  analysis,
  contour = [],
  offsetContour = [],
  maskOpacity = 0.45,
}: {
  analysis: PhotoAnalysis;
  /** Smoothed outline (full-res px) — drawn solid. */
  contour?: Point2D[];
  /** Clearance-offset outline (full-res px) — drawn dashed (the pocket). */
  offsetContour?: Point2D[];
  /** Green mask tint strength, 0 (off) … 1 (opaque). */
  maskOpacity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const { imageData, width, height, mask, token, objectBBoxPx } = analysis;

    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const cw = Math.max(1, Math.round(width * scale));
    const ch = Math.max(1, Math.round(height * scale));
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // photo (downscaled through a full-res temp canvas)
    const tmp = document.createElement('canvas');
    tmp.width = width;
    tmp.height = height;
    tmp.getContext('2d')?.putImageData(imageData, 0, 0);
    ctx.drawImage(tmp, 0, 0, cw, ch);

    // green mask tint (nearest-sample the full-res mask) — blend toward green by maskOpacity
    if (maskOpacity > 0) {
      const a = Math.min(1, maskOpacity);
      const frame = ctx.getImageData(0, 0, cw, ch);
      const d = frame.data;
      for (let y = 0; y < ch; y += 1) {
        const sy = Math.min(height - 1, Math.floor(y / scale));
        for (let x = 0; x < cw; x += 1) {
          const sx = Math.min(width - 1, Math.floor(x / scale));
          if (mask.data[sy * width + sx] > 0) {
            const i = (y * cw + x) * 4;
            d[i] = Math.round(d[i] * (1 - a) + 64 * a);
            d[i + 1] = Math.round(d[i + 1] * (1 - a) + 200 * a);
            d[i + 2] = Math.round(d[i + 2] * (1 - a) + 80 * a);
          }
        }
      }
      ctx.putImageData(frame, 0, 0);
    }

    // token circle
    if (token.found && token.centerPx && token.radiusPx) {
      ctx.strokeStyle = 'rgb(56,200,255)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(token.centerPx.x * scale, token.centerPx.y * scale, token.radiusPx * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // object bounding box — only until a contour is shown (then it'd be clutter)
    if (objectBBoxPx && contour.length === 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(objectBBoxPx.x * scale, objectBBoxPx.y * scale, objectBBoxPx.w * scale, objectBBoxPx.h * scale);
      ctx.setLineDash([]);
    }

    // clearance offset (the pocket) dashed amber, then the smoothed contour solid accent
    drawRing(ctx, offsetContour, scale, 'rgb(245,158,11)', 2, [7, 5]);
    drawRing(ctx, contour, scale, 'rgb(47,120,212)', 2.5);
  }, [analysis, contour, offsetContour, maskOpacity]);

  return <canvas ref={ref} className="max-h-full max-w-full rounded-lg" />;
}
