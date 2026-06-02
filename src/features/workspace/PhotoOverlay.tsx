import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { PhotoAnalysis } from '../../vision/analyze';
import type { BBox } from '../../vision/mask';
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
  mask = null,
  bbox = null,
  contour = [],
  offsetContour = [],
  maskOpacity = 0.45,
  brightness = 0,
  contrast = 0,
  onPaint,
  brushSize = 24,
  brushErase = false,
}: {
  analysis: PhotoAnalysis;
  /** Isolated-tool mask (full-res 0/255), re-derived at the detection threshold. */
  mask?: { data: Uint8Array; width: number; height: number } | null;
  /** Object bounding box (full-res px). */
  bbox?: BBox | null;
  /** Smoothed outline (full-res px) — drawn solid. */
  contour?: Point2D[];
  /** Clearance-offset outline (full-res px) — drawn dashed (the pocket). */
  offsetContour?: Point2D[];
  /** Green mask tint strength, 0 (off) … 1 (opaque). */
  maskOpacity?: number;
  /** Display brightness/contrast — mirrors what u2netp saw (applied at canvas resolution). */
  brightness?: number;
  contrast?: number;
  /** Brush: paint a disc in mask-space; radius in CSS px; erase tints the cursor differently. */
  onPaint?: (maskX: number, maskY: number, maskRadius: number) => void;
  brushSize?: number;
  brushErase?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const painting = useRef(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const { imageData, width, height, token } = analysis;

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

    // One pixel pass at canvas resolution: brightness/contrast (mirrors the model input) + the
    // green mask tint. Cheap (≤ MAX_SIDE²) — never touches the full-res image.
    const tintMask = !!mask && maskOpacity > 0;
    if (brightness !== 0 || contrast !== 0 || tintMask) {
      const frame = ctx.getImageData(0, 0, cw, ch);
      const d = frame.data;
      if (brightness !== 0 || contrast !== 0) {
        const f = (259 * (contrast + 255)) / (255 * (259 - contrast));
        for (let i = 0; i < d.length; i += 4) {
          d[i] = f * (d[i] - 128) + 128 + brightness;
          d[i + 1] = f * (d[i + 1] - 128) + 128 + brightness;
          d[i + 2] = f * (d[i + 2] - 128) + 128 + brightness;
        }
      }
      if (mask && tintMask) {
        const a = Math.min(1, maskOpacity);
        const mw = mask.width;
        const mh = mask.height;
        for (let y = 0; y < ch; y += 1) {
          const my = Math.min(mh - 1, Math.floor((y / ch) * mh));
          for (let x = 0; x < cw; x += 1) {
            const mx = Math.min(mw - 1, Math.floor((x / cw) * mw));
            if (mask.data[my * mw + mx] > 0) {
              const i = (y * cw + x) * 4;
              d[i] = d[i] * (1 - a) + 64 * a;
              d[i + 1] = d[i + 1] * (1 - a) + 200 * a;
              d[i + 2] = d[i + 2] * (1 - a) + 80 * a;
            }
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
    if (bbox && contour.length === 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(bbox.x * scale, bbox.y * scale, bbox.w * scale, bbox.h * scale);
      ctx.setLineDash([]);
    }

    // clearance offset (the pocket) dashed amber, then the smoothed contour solid accent
    drawRing(ctx, offsetContour, scale, 'rgb(245,158,11)', 2, [7, 5]);
    drawRing(ctx, contour, scale, 'rgb(47,120,212)', 2.5);
  }, [analysis, mask, bbox, contour, offsetContour, maskOpacity, brightness, contrast]);

  const canPaint = !!onPaint && !!mask;

  const paintAt = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas || !onPaint || !mask) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const mx = (px / rect.width) * mask.width;
    const my = (py / rect.height) * mask.height;
    const mr = (brushSize / rect.width) * mask.width;
    onPaint(mx, my, mr);
  };

  return (
    <div className="relative inline-flex max-h-full max-w-full">
      <canvas
        ref={ref}
        className={`max-h-full max-w-full rounded-lg ${canPaint ? 'cursor-none touch-none' : ''}`}
        onPointerDown={
          canPaint
            ? (e) => {
                painting.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                paintAt(e);
              }
            : undefined
        }
        onPointerMove={
          canPaint
            ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                if (painting.current) paintAt(e);
              }
            : undefined
        }
        onPointerUp={canPaint ? () => (painting.current = false) : undefined}
        onPointerLeave={canPaint ? () => setCursor(null) : undefined}
      />
      {canPaint && cursor && (
        <span
          className="pointer-events-none absolute rounded-full border-2"
          style={{
            left: cursor.x - brushSize,
            top: cursor.y - brushSize,
            width: brushSize * 2,
            height: brushSize * 2,
            borderColor: brushErase ? 'rgba(239,68,68,0.9)' : 'rgba(47,120,212,0.9)',
            background: brushErase ? 'rgba(239,68,68,0.12)' : 'rgba(47,120,212,0.12)',
          }}
        />
      )}
    </div>
  );
}
