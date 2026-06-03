import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Check } from 'lucide-react';
import type { PhotoAnalysis } from '../../vision/analyze';
import type { BBox } from '../../vision/mask';
import type { Point2D } from '../../core/offset';
import { deleteNode, insertNode, moveNode, nearestNode, nearestSegment } from '../../core/contour';
import { LassoEditor } from './LassoEditor';
import {
  defaultCropBox,
  moveCropBox,
  resizeCropBox,
  type CropHandle,
  type CropRect,
} from '../../vision/photo-transform';
import { useI18n } from '../../i18n';

/** Cap the rendered canvas so a 12 MP phone photo doesn't allocate a huge surface. */
const MAX_SIDE = 1024;

/** The 8 crop handles: corners + edge midpoints, with their fractional position on the box. */
const CROP_HANDLES: { id: CropHandle; fx: number; fy: number; cursor: string }[] = [
  { id: 'nw', fx: 0, fy: 0, cursor: 'nwse-resize' },
  { id: 'n', fx: 0.5, fy: 0, cursor: 'ns-resize' },
  { id: 'ne', fx: 1, fy: 0, cursor: 'nesw-resize' },
  { id: 'e', fx: 1, fy: 0.5, cursor: 'ew-resize' },
  { id: 'se', fx: 1, fy: 1, cursor: 'nwse-resize' },
  { id: 's', fx: 0.5, fy: 1, cursor: 'ns-resize' },
  { id: 'sw', fx: 0, fy: 1, cursor: 'nesw-resize' },
  { id: 'w', fx: 0, fy: 0.5, cursor: 'ew-resize' },
];
/** Pointer proximity (display px) to grab a handle. */
const HANDLE_HIT = 16;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** ~Square-cell count across the short side of the alignment grid. */
const GRID_DIVISIONS = 10;

/**
 * Optional alignment grid over the photo (framing aid). An SVG sized to the canvas rect via
 * `viewBox` in image px + `preserveAspectRatio="none"` — since the canvas preserves the image
 * aspect, cells of equal user units stay square on screen. `non-scaling-stroke` keeps the lines
 * ~1 px at any display size. Display-only; `pointer-events-none` so it never blocks gestures.
 */
function AlignmentGrid({ width, height }: { width: number; height: number }) {
  const cell = Math.max(8, Math.round(Math.min(width, height) / GRID_DIVISIONS));
  const lines: { key: string; x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let x = cell; x < width; x += cell) lines.push({ key: `v${x}`, x1: x, y1: 0, x2: x, y2: height });
  for (let y = cell; y < height; y += cell) lines.push({ key: `h${y}`, x1: 0, y1: y, x2: width, y2: y });
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden rounded-lg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g stroke="#94a3b8" strokeWidth={1} strokeOpacity={0.6}>
        {lines.map((l) => (
          <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}

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

const EDIT_STROKE = '#2f78d4';

/**
 * Editable-contour overlay (spec 035): a dimming veil so the photo recedes, plus the polygon and
 * round node handles. Drag a node to move it, click a segment to insert one, double-click a node to
 * delete it (≥ 3 kept). Coords are full-res image px via the SVG `viewBox`; a measured display scale
 * keeps the handles + hit areas ~constant in screen px at any photo resolution. Drag updates a local
 * copy (smooth) and commits to the parent on pointer-up.
 */
function ContourEditor({
  width,
  height,
  nodes,
  onChange,
}: {
  width: number;
  height: number;
  nodes: Point2D[];
  onChange: (ring: Point2D[]) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ idx: number; nodes: Point2D[] } | null>(null);
  const [dispW, setDispW] = useState(0);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const update = () => setDispW(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const displayScale = dispW > 0 ? dispW / width : 1;
  const nodeR = 7 / displayScale; // ~7 px on-screen handle radius, expressed in image px
  const hitR = 14 / displayScale; // ~14 px on-screen grab radius
  const view = drag ? drag.nodes : nodes;

  const toImg = (clientX: number, clientY: number): Point2D => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [((clientX - rect.left) / rect.width) * width, ((clientY - rect.top) / rect.height) * height];
  };
  const onDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    svgRef.current?.setPointerCapture(e.pointerId);
    const p = toImg(e.clientX, e.clientY);
    const ni = nearestNode(nodes, p, hitR);
    if (ni >= 0) {
      setDrag({ idx: ni, nodes });
      return;
    }
    const seg = nearestSegment(nodes, p, hitR);
    if (seg) setDrag({ idx: seg.index + 1, nodes: insertNode(nodes, seg.index, seg.point) });
  };
  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag) return;
    setDrag({ idx: drag.idx, nodes: moveNode(drag.nodes, drag.idx, toImg(e.clientX, e.clientY)) });
  };
  const onUp = () => {
    if (!drag) return;
    onChange(drag.nodes);
    setDrag(null);
  };
  const onDouble = (e: ReactMouseEvent<SVGSVGElement>) => {
    const p = toImg(e.clientX, e.clientY);
    const ni = nearestNode(nodes, p, hitR);
    if (ni >= 0) onChange(deleteNode(nodes, ni));
  };

  const d = view.length ? `M${view.map(([x, y]) => `${x},${y}`).join('L')}Z` : '';
  return (
    <>
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-white/55" />
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full touch-none"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ cursor: 'crosshair' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onDoubleClick={onDouble}
      >
        <path d={d} fill="rgba(59,142,240,0.10)" stroke={EDIT_STROKE} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {view.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={nodeR}
            fill="#ffffff"
            stroke={EDIT_STROKE}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </>
  );
}

/**
 * Draw the analysed photo with the vision overlay: green tint on the isolated tool mask,
 * a cyan token circle, and the object's bounding box — the in-app equivalent of the
 * `verify:seg` overlays, so detection + segmentation can be validated visually.
 */
export function PhotoOverlay({
  imageRef,
  width,
  height,
  frameKey,
  token = null,
  mask = null,
  bbox = null,
  contour = [],
  offsetContour = [],
  maskOpacity = 0.45,
  showGrid = false,
  brightness = 0,
  contrast = 0,
  onPaint,
  brushSize = 24,
  brushErase = false,
  tool = 'brush',
  editNodes,
  onEditNodes,
  onLasso,
  onCancelLasso,
  onStraighten,
  onCrop,
  onCancelCrop,
}: {
  /** The framed/cropped photo pixels, passed **by ref** (not as a prop) so the megabyte-sized
   * ImageData never goes through React's reconciler — a dev-mode walk of it froze the UI ~3 s on
   * every crop. The redraw is triggered by the cheap `frameKey` instead. */
  imageRef: { current: ImageData | null };
  /** Framed image size (px) — the coordinate space for the gestures. */
  width: number;
  height: number;
  /** Cheap framing identity — changes to trigger a redraw from `imageRef.current`. */
  frameKey: string | null;
  /** Calibration token circle to draw, or null when there's no (current) detection. */
  token?: PhotoAnalysis['token'] | null;
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
  /** Show an alignment grid over the photo (framing aid, display-only). */
  showGrid?: boolean;
  /** Display brightness/contrast — mirrors what u2netp saw (applied at canvas resolution). */
  brightness?: number;
  contrast?: number;
  /** Brush: paint a disc in mask-space; radius in CSS px; erase tints the cursor differently. */
  onPaint?: (maskX: number, maskY: number, maskRadius: number) => void;
  brushSize?: number;
  brushErase?: boolean;
  /** Active interaction tool. */
  tool?: 'brush' | 'straighten' | 'crop' | 'contour' | 'lasso';
  /** Editable-contour nodes (full-res px) shown in `contour` mode. */
  editNodes?: Point2D[];
  /** Commit an edited node ring (move / insert / delete). */
  onEditNodes?: (ring: Point2D[]) => void;
  /** Magnetic lasso (spec 037): a closed contour (full-res px) on completion, + cancel. */
  onLasso?: (ring: Point2D[]) => void;
  onCancelLasso?: () => void;
  /** Straighten gesture: two points (image px) along a line that should be level. */
  onStraighten?: (p1: Point2D, p2: Point2D) => void;
  /** Crop applied: two opposite corners (image px) of the kept region. */
  onCrop?: (p1: Point2D, p2: Point2D) => void;
  /** Leave crop mode without applying. */
  onCancelCrop?: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLCanvasElement>(null);
  const painting = useRef(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const imageData = imageRef.current;
    if (!imageData) return;

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
    if (token?.found && token.centerPx && token.radiusPx) {
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

    // clearance offset (the pocket) dashed amber, then the smoothed contour solid accent. Skipped
    // while editing the contour — the editable overlay (ContourEditor) draws it instead.
    if (tool !== 'contour' && tool !== 'lasso') {
      drawRing(ctx, offsetContour, scale, 'rgb(245,158,11)', 2, [7, 5]);
      drawRing(ctx, contour, scale, 'rgb(47,120,212)', 2.5);
    }
  }, [frameKey, width, height, token, mask, bbox, contour, offsetContour, maskOpacity, brightness, contrast, tool]);

  const canPaint = tool === 'brush' && !!onPaint && !!mask;
  const straightening = tool === 'straighten';
  const cropping = tool === 'crop';
  const active = canPaint || straightening || cropping;
  const [drag, setDrag] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  // Crop draft: the live, adjustable zone (normalised to the current image). It's transient —
  // only the *applied* crop becomes app state (via onCrop). Proposed immediately on crop entry.
  const [cropBox, setCropBox] = useState<CropRect | null>(null);
  const cropDrag = useRef<{
    mode: 'move' | 'resize' | 'draw';
    handle?: CropHandle;
    startBox?: CropRect;
    startPtr?: Point2D;
    anchor?: Point2D;
  } | null>(null);
  const [cropCursor, setCropCursor] = useState('crosshair');

  useEffect(() => {
    setCropBox(cropping ? defaultCropBox() : null);
    cropDrag.current = null;
    setCropCursor('crosshair');
  }, [cropping]);

  const paintAt = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas || !onPaint || !mask) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * mask.width;
    const my = ((e.clientY - rect.top) / rect.height) * mask.height;
    const mr = (brushSize / rect.width) * mask.width;
    onPaint(mx, my, mr);
  };

  /** Display px → image px (full-res of the transformed photo). */
  const toImg = (e: ReactPointerEvent<HTMLCanvasElement>): Point2D => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) / rect.width) * width,
      ((e.clientY - rect.top) / rect.height) * height,
    ];
  };
  /** Display px → normalised [0,1] of the image. */
  const toNorm = (e: ReactPointerEvent<HTMLCanvasElement>): Point2D => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [clamp01((e.clientX - rect.left) / rect.width), clamp01((e.clientY - rect.top) / rect.height)];
  };
  /** The crop handle near the pointer (display-px proximity), or null. */
  const hitHandle = (e: ReactPointerEvent<HTMLCanvasElement>, box: CropRect): CropHandle | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    for (const h of CROP_HANDLES) {
      const hx = (box.x + h.fx * box.w) * rect.width;
      const hy = (box.y + h.fy * box.h) * rect.height;
      if (Math.abs(px - hx) <= HANDLE_HIT && Math.abs(py - hy) <= HANDLE_HIT) return h.id;
    }
    return null;
  };
  /** Hover cursor over the crop zone (resize on a handle, move inside, crosshair outside). */
  const regionCursor = (e: ReactPointerEvent<HTMLCanvasElement>): string => {
    if (!cropBox) return 'crosshair';
    const handle = hitHandle(e, cropBox);
    if (handle) return CROP_HANDLES.find((c) => c.id === handle)!.cursor;
    const [nx, ny] = toNorm(e);
    const inside = nx >= cropBox.x && nx <= cropBox.x + cropBox.w && ny >= cropBox.y && ny <= cropBox.y + cropBox.h;
    return inside ? 'move' : 'crosshair';
  };

  const applyCrop = () => {
    if (!cropBox) return;
    const W = width;
    const H = height;
    onCrop?.([cropBox.x * W, cropBox.y * H], [(cropBox.x + cropBox.w) * W, (cropBox.y + cropBox.h) * H]);
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (canPaint) {
      painting.current = true;
      paintAt(e);
    } else if (straightening) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDrag({ sx: x, sy: y, ex: x, ey: y });
    } else if (cropping) {
      const box = cropBox ?? defaultCropBox();
      const [nx, ny] = toNorm(e);
      const handle = hitHandle(e, box);
      if (handle) {
        cropDrag.current = { mode: 'resize', handle };
        setCropCursor(CROP_HANDLES.find((c) => c.id === handle)!.cursor);
      } else if (nx >= box.x && nx <= box.x + box.w && ny >= box.y && ny <= box.y + box.h) {
        cropDrag.current = { mode: 'move', startBox: box, startPtr: [nx, ny] };
        setCropCursor('move');
      } else {
        cropDrag.current = { mode: 'draw', anchor: [nx, ny] };
        setCropCursor('crosshair');
      }
      if (!cropBox) setCropBox(box);
    }
  };
  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (canPaint) {
      const rect = e.currentTarget.getBoundingClientRect();
      setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      if (painting.current) paintAt(e);
    } else if (straightening) {
      if (!drag) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setDrag({ ...drag, ex: e.clientX - rect.left, ey: e.clientY - rect.top });
    } else if (cropping) {
      const d = cropDrag.current;
      if (!d) {
        setCropCursor(regionCursor(e));
        return;
      }
      const [nx, ny] = toNorm(e);
      if (d.mode === 'resize') setCropBox((b) => (b ? resizeCropBox(b, d.handle!, nx, ny) : b));
      else if (d.mode === 'move') setCropBox(moveCropBox(d.startBox!, nx - d.startPtr![0], ny - d.startPtr![1]));
      else {
        const [ax, ay] = d.anchor!;
        setCropBox({ x: Math.min(ax, nx), y: Math.min(ay, ny), w: Math.abs(nx - ax), h: Math.abs(ny - ay) });
      }
    }
  };
  const onUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (canPaint) {
      painting.current = false;
    } else if (straightening && drag) {
      const rect = e.currentTarget.getBoundingClientRect();
      const p1: Point2D = [(drag.sx / rect.width) * width, (drag.sy / rect.height) * height];
      const p2 = toImg(e);
      setDrag(null);
      onStraighten?.(p1, p2);
    } else if (cropping) {
      cropDrag.current = null;
      setCropCursor(regionCursor(e));
    }
  };

  const cursorStyle = canPaint ? 'none' : straightening ? 'crosshair' : cropping ? cropCursor : undefined;

  return (
    <div className="relative inline-flex max-h-full max-w-full">
      <canvas
        ref={ref}
        className={`max-h-full max-w-full rounded-lg ${active ? 'touch-none' : ''}`}
        style={{ cursor: cursorStyle }}
        onPointerDown={active ? onDown : undefined}
        onPointerMove={active ? onMove : undefined}
        onPointerUp={active ? onUp : undefined}
        onPointerLeave={() => setCursor(null)}
      />
      {showGrid && width > 0 && height > 0 && <AlignmentGrid width={width} height={height} />}
      {tool === 'contour' && editNodes && editNodes.length >= 3 && width > 0 && height > 0 && (
        <ContourEditor width={width} height={height} nodes={editNodes} onChange={(ring) => onEditNodes?.(ring)} />
      )}
      {tool === 'lasso' && width > 0 && height > 0 && (
        <LassoEditor
          imageRef={imageRef}
          width={width}
          height={height}
          onComplete={(ring) => onLasso?.(ring)}
          onCancel={() => onCancelLasso?.()}
        />
      )}
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
      {straightening && drag && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            x1={drag.sx}
            y1={drag.sy}
            x2={drag.ex}
            y2={drag.ey}
            stroke="rgb(239,68,68)"
            strokeWidth={2.5}
            strokeDasharray="7 5"
          />
        </svg>
      )}
      {cropping && cropBox && (
        <>
          {/* dim everything outside the kept zone */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <rect x="0" y="0" width="100" height={cropBox.y * 100} fill="rgba(0,0,0,0.4)" />
            <rect
              x="0"
              y={(cropBox.y + cropBox.h) * 100}
              width="100"
              height={(1 - cropBox.y - cropBox.h) * 100}
              fill="rgba(0,0,0,0.4)"
            />
            <rect x="0" y={cropBox.y * 100} width={cropBox.x * 100} height={cropBox.h * 100} fill="rgba(0,0,0,0.4)" />
            <rect
              x={(cropBox.x + cropBox.w) * 100}
              y={cropBox.y * 100}
              width={(1 - cropBox.x - cropBox.w) * 100}
              height={cropBox.h * 100}
              fill="rgba(0,0,0,0.4)"
            />
          </svg>
          {/* red dashed border */}
          <div
            className="pointer-events-none absolute border-2 border-dashed"
            style={{
              left: `${cropBox.x * 100}%`,
              top: `${cropBox.y * 100}%`,
              width: `${cropBox.w * 100}%`,
              height: `${cropBox.h * 100}%`,
              borderColor: 'rgb(239,68,68)',
            }}
          />
          {/* resize handles */}
          {CROP_HANDLES.map((h) => (
            <span
              key={h.id}
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white bg-red-500 shadow"
              style={{
                left: `${(cropBox.x + h.fx * cropBox.w) * 100}%`,
                top: `${(cropBox.y + h.fy * cropBox.h) * 100}%`,
              }}
            />
          ))}
          {/* apply / cancel */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            <button
              type="button"
              onClick={() => onCancelCrop?.()}
              className="rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              {t('params.cropCancel')}
            </button>
            <button
              type="button"
              onClick={applyCrop}
              className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-700"
            >
              <Check size={14} /> {t('params.cropApply')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
