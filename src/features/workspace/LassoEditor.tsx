import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { buildLiveWire, type LiveWire } from '../../core/livewire';
import type { Point2D } from '../../core/offset';

const WORK_MAX = 480; // live-wire working resolution (max side) — Dijkstra per click stays snappy
const STROKE = '#2f78d4';

type Engine = { lw: LiveWire; s: number; ww: number; wh: number };

function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/**
 * Magnetic lasso (spec 037): live-wire boundary tracing. Click to start on the object's edge, move
 * the cursor along the edge — the wire snaps to it (Intelligent Scissors) — and click to drop
 * anchors. Click the first anchor (or double-click) to **close** the loop; the resulting contour
 * seeds the editable contour (035). Backspace undoes the last anchor, Esc cancels.
 *
 * Everything runs in **working px** (a downscaled grayscale built from the framed photo); only the
 * final closed ring is scaled back to framed px for the caller.
 */
export function LassoEditor({
  imageRef,
  width,
  height,
  onComplete,
  onCancel,
}: {
  imageRef: { current: ImageData | null };
  width: number;
  height: number;
  onComplete: (ring: Point2D[]) => void;
  onCancel: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const engine = useRef<Engine | null>(null);
  const [ready, setReady] = useState(false);
  const [dispW, setDispW] = useState(0);
  // committed edge-following path + the anchors placed on it (with the path length at each anchor,
  // so Backspace can rewind exactly). All in working px.
  const [committed, setCommitted] = useState<Point2D[]>([]);
  const [anchors, setAnchors] = useState<Point2D[]>([]);
  const marks = useRef<number[]>([]);
  const [cursor, setCursor] = useState<Point2D | null>(null);
  const [live, setLive] = useState<Point2D[]>([]);

  // Build the cost map once from the framed photo (downscaled grayscale).
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    const s = Math.min(1, WORK_MAX / Math.max(width, height));
    const ww = Math.max(8, Math.round(width * s));
    const wh = Math.max(8, Math.round(height * s));
    const full = document.createElement('canvas');
    full.width = width;
    full.height = height;
    full.getContext('2d')?.putImageData(img, 0, 0);
    const small = document.createElement('canvas');
    small.width = ww;
    small.height = wh;
    const sctx = small.getContext('2d');
    if (!sctx) return;
    sctx.drawImage(full, 0, 0, ww, wh);
    const data = sctx.getImageData(0, 0, ww, wh).data;
    const gray = new Float32Array(ww * wh);
    for (let i = 0, j = 0; i < gray.length; i += 1, j += 4) {
      gray[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
    }
    engine.current = { lw: buildLiveWire(gray, ww, wh), s, ww, wh };
    setReady(true);
  }, [imageRef, width, height]);

  // Measured display scale → constant-size anchors + a screen-px close threshold.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const update = () => setDispW(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  const eng = engine.current;
  const displayScale = eng && dispW > 0 ? dispW / eng.ww : 1;
  const dotR = 2.5 / displayScale;
  const closeR = 14 / displayScale;

  const toWork = (clientX: number, clientY: number): Point2D => {
    const rect = svgRef.current!.getBoundingClientRect();
    const e = engine.current!;
    return [((clientX - rect.left) / rect.width) * e.ww, ((clientY - rect.top) / rect.height) * e.wh];
  };

  const finish = (): void => {
    const e = engine.current;
    if (!e || anchors.length < 2) return;
    const closing = e.lw.pathTo(anchors[0][0], anchors[0][1]); // last seed → first anchor
    const ring = [...committed, ...closing.slice(1)];
    if (ring.length < 3) return;
    onComplete(ring.map(([x, y]): Point2D => [x / e.s, y / e.s]));
  };

  const onPointerMove = (ev: ReactPointerEvent<SVGSVGElement>) => {
    const e = engine.current;
    if (!e) return;
    const p = toWork(ev.clientX, ev.clientY);
    setCursor(p);
    setLive(anchors.length > 0 ? e.lw.pathTo(p[0], p[1]) : []);
  };

  const onClick = (ev: ReactMouseEvent<SVGSVGElement>) => {
    const e = engine.current;
    if (!e) return;
    const p = toWork(ev.clientX, ev.clientY);
    if (anchors.length === 0) {
      e.lw.setSeed(p[0], p[1]);
      marks.current = [0];
      setAnchors([p]);
      setCommitted([p]);
      return;
    }
    if (anchors.length >= 2 && dist(p, anchors[0]) <= closeR) {
      finish();
      return;
    }
    const seg = e.lw.pathTo(p[0], p[1]); // current seed → p (edge-following)
    setCommitted((c) => {
      marks.current = [...marks.current, c.length];
      return [...c, ...seg.slice(1)];
    });
    setAnchors((a) => [...a, p]);
    e.lw.setSeed(p[0], p[1]);
    setLive([]);
  };

  const undoLast = (): void => {
    const e = engine.current;
    if (!e || anchors.length === 0) return;
    if (anchors.length === 1) {
      marks.current = [];
      setAnchors([]);
      setCommitted([]);
      setLive([]);
      return;
    }
    const back = anchors[anchors.length - 2];
    const cut = marks.current[marks.current.length - 1];
    marks.current = marks.current.slice(0, -1);
    setAnchors((a) => a.slice(0, -1));
    setCommitted((c) => c.slice(0, cut));
    e.lw.setSeed(back[0], back[1]);
    setLive([]);
  };

  // Keyboard: Esc / Backspace undo the last anchor, walking back to the start; once nothing is
  // left, a further Esc leaves the lasso tool.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        if (anchors.length > 0) undoLast();
        else onCancel();
      } else if (ev.key === 'Backspace') {
        ev.preventDefault();
        undoLast();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toPath = (pts: Point2D[]): string => (pts.length ? `M${pts.map(([x, y]) => `${x},${y}`).join('L')}` : '');
  const first = anchors[0];
  const nearClose = !!first && anchors.length >= 2 && !!cursor && dist(cursor, first) <= closeR;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-white/40" />
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full touch-none"
        viewBox={eng ? `0 0 ${eng.ww} ${eng.wh}` : undefined}
        preserveAspectRatio="none"
        style={{ cursor: 'crosshair' }}
        onPointerMove={onPointerMove}
        onClick={onClick}
        onDoubleClick={() => finish()}
      >
        {/* committed edge-following path */}
        <path d={toPath(committed)} fill="none" stroke={STROKE} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {/* live wire from the last anchor to the cursor */}
        {live.length > 1 && (
          <path
            d={toPath(live)}
            fill="none"
            stroke={STROKE}
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeOpacity={0.8}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {/* anchors; the first is highlighted (green) when the cursor is in closing range */}
        {anchors.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={dotR}
            fill={i === 0 && nearClose ? '#22c55e' : '#ffffff'}
            stroke={i === 0 && nearClose ? '#16a34a' : STROKE}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </>
  );
}
