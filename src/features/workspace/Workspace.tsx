import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './Header';
import { ControlsPanel } from './ControlsPanel';
import { OutlinePanel } from './OutlinePanel';
import { Viewer } from './Viewer';
import { useBin } from './useBin';
import { usePhotoAnalysis, useDerivedMask } from './usePhotoAnalysis';
import { useMaskEdit } from './useMaskEdit';
import { useUndoRedo } from './useUndoRedo';
import { binFilename, downloadBlob } from '../../cad/export';
import { gridForFootprint } from '../../core/sizing';
import { refineContour } from '../../core/contour';
import { offsetPolygon, type Point2D } from '../../core/offset';
import { contourToFootprintMm } from '../../core/footprint';
import { straightenAngleDeg, normaliseCrop, rotateCrop90, type CropRect } from '../../vision/photo-transform';
import type { SegmentMode } from '../../vision/segment-mode';
import { useI18n } from '../../i18n';

/** Fold an angle to (−180°, 180°] so repeated quarter-turns stay readable. */
function normaliseAngle(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

/** Compose a crop drawn on an already-cropped image back into the rotated image's space. */
function composeCrop(outer: CropRect | null, inner: CropRect): CropRect {
  if (!outer) return inner;
  return {
    x: outer.x + inner.x * outer.w,
    y: outer.y + inner.y * outer.h,
    w: inner.w * outer.w,
    h: inner.h * outer.h,
  };
}

/** Photo framing tool (Outline tab): brush (default) vs straighten vs crop. */
export type FrameTool = 'none' | 'straighten' | 'crop';
// Bundled font faces embedded into the PDF plan (non-embedded fonts fail at the print spooler).
import interRegularUrl from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import interBoldUrl from '@fontsource/inter/files/inter-latin-700-normal.woff?url';

export interface Params {
  pitchMm: number;
  cols: number;
  rows: number;
  /** When false, cols/rows are auto-derived from the detected object. */
  manualSize: boolean;
  heightUnits: number;
  thicknessMm: number;
  /** Printing clearance added around the contour (mm). */
  offsetMm: number;
  /** Contour smoothing knob, 0 (faithful) … 1 (smooth). */
  smoothingFactor: number;
  /** Pre-inference background-flatten strength, 0 (off) … 1 (full) — removes soft shadows. */
  flattenStrength: number;
  /** Pre-inference image brightness (washes light shadows toward white). */
  brightness: number;
  /** Pre-inference image contrast. */
  contrast: number;
  /** u2netp saliency cut, higher = stricter (drops shadows). */
  detectThreshold: number;
  /** Détourage source: auto-pick (default) / force u2netp (standard) / force edges (transparent). */
  segmentMode: SegmentMode;
  /** Brush: add paints object, erase removes it. */
  brushMode: 'add' | 'erase';
  /** Brush radius in canvas CSS px. */
  brushSize: number;
  /** Show the green segmentation tint over the photo. */
  showMask: boolean;
  /** Green tint strength when shown, 0 … 1. */
  maskOpacity: number;
  includeLip: boolean;
  /** Calibration token outer diameter (mm) — measure the printed token for best accuracy. */
  tokenOdMm: number;
  /** Preview render opacity, 0.2…1 (1 = opaque). Lower it to see the pocket through the walls. */
  renderOpacity: number;
  /** Vertical pinch grip: a symmetric pair of finger scoops at the object's edge. */
  gripNotches: boolean;
  /** Finger-scoop radius in mm. */
  notchRadiusMm: number;
  /** Symmetric X offset from the object edge, mm. */
  notchOffsetXMm: number;
  /** Y offset along the depth, mm. */
  notchOffsetYMm: number;
  /** Straighten near-axis contour edges (crisp, snapped to the object's dominant axis). */
  straightenEdges: boolean;
  /** How close to the axis an edge must be (degrees) to get straightened. */
  straightenToleranceDeg: number;
  /** Photo framing: rotate the photo by this many degrees before analysis. */
  straightenDeg: number;
  /** Photo framing: crop to this normalised rect before analysis (null = full). */
  cropRect: CropRect | null;
}

const initialParams: Params = {
  pitchMm: 42,
  cols: 2,
  rows: 1,
  manualSize: false,
  heightUnits: 3,
  thicknessMm: 18,
  offsetMm: 1,
  smoothingFactor: 0.3,
  flattenStrength: 0,
  brightness: 0,
  contrast: 0,
  detectThreshold: 0.5,
  segmentMode: 'auto',
  brushMode: 'add',
  brushSize: 24,
  showMask: true,
  maskOpacity: 0.45,
  includeLip: true,
  tokenOdMm: 76.2,
  renderOpacity: 0.75,
  gripNotches: false,
  notchRadiusMm: 9,
  notchOffsetXMm: 0,
  notchOffsetYMm: 0,
  straightenEdges: false,
  straightenToleranceDeg: 8,
  straightenDeg: 0,
  cropRect: null,
};

export function Workspace() {
  const { t } = useI18n();
  const [params, setParams] = useState<Params>(initialParams);
  const [tab, setTab] = useState<'outline' | 'preview'>('outline');
  const [frameTool, setFrameTool] = useState<FrameTool>('none');
  const [photoEpoch, setPhotoEpoch] = useState(0); // bumps per new photo → resets undo history
  const set = <K extends keyof Params>(key: K, value: Params[K]) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const photo = usePhotoAnalysis({
    flatten: params.flattenStrength,
    brightness: params.brightness,
    contrast: params.contrast,
    straightenDeg: params.straightenDeg,
    cropRect: params.cropRect,
  });

  // Framing gestures (drawn on the current transformed photo, in its px space).
  const onStraighten = (p1: Point2D, p2: Point2D) => {
    // accumulate the rotation. The crop is KEPT: a fine straighten just rotates the content
    // inside the cropped frame (the expected result), so it must not revert to the full photo.
    setParams((p) => ({ ...p, straightenDeg: normaliseAngle(p.straightenDeg + straightenAngleDeg(p1, p2)) }));
    setFrameTool('none'); // the ruler is one-shot: it deactivates after setting the angle
  };
  /** Quarter-turn left (−90°) / right (+90°). The crop is **kept**, turned with the photo so it
   * still frames the same content (the 90° swap of W/H is handled by `rotateCrop90`). */
  const rotate90 = (dir: -1 | 1) =>
    setParams((p) => ({
      ...p,
      straightenDeg: normaliseAngle(p.straightenDeg + dir * 90),
      cropRect: rotateCrop90(p.cropRect, dir),
    }));
  const onCrop = (p1: Point2D, p2: Point2D) => {
    // normalise against the *displayed* (framed) image — the gesture was drawn on it.
    const w = photo.framed?.width ?? 0;
    const h = photo.framed?.height ?? 0;
    if (w < 1 || h < 1) return;
    const inner = normaliseCrop(p1, p2, w, h);
    if (inner.w < 0.02 || inner.h < 0.02) return; // ignore tiny accidental drags
    setParams((p) => ({ ...p, cropRect: composeCrop(p.cropRect, inner) }));
    setFrameTool('none'); // crop is applied once → leave crop mode
  };
  const resetFraming = () => setParams((p) => ({ ...p, straightenDeg: 0, cropRect: null }));
  const derived = useDerivedMask(photo.result, params.detectThreshold, params.segmentMode);
  const { editedMask, hasEdits, paint, reset, version, snapshot, restore } = useMaskEdit(
    derived,
    photo.result?.width ?? 0,
    photo.result?.height ?? 0,
  );

  // Multi-step undo/redo over the params + the brush edits (see useUndoRedo).
  const history = useUndoRedo({ params, setParams, version, snapshot, restore, resetKey: photoEpoch });
  const historyRef = useRef(history);
  historyRef.current = history;
  // Standard shortcuts on macOS / Windows / Linux: ⌘/Ctrl+Z = undo, ⌘/Ctrl+⇧Z = redo, and
  // Ctrl+Y = redo (the common Windows/Linux variant). Attached once; reads the latest via a ref.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) historyRef.current.redo();
        else historyRef.current.undo();
      } else if (key === 'y') {
        e.preventDefault();
        historyRef.current.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Calibration scale, recomputed from the detected token radius + the OD setting — so
  // changing the OD (or pitch) re-derives the size without re-running the vision pipeline.
  const tokenRadiusPx = photo.result?.token.found ? (photo.result.token.radiusPx ?? null) : null;
  const scaleMmPerPx = tokenRadiusPx ? params.tokenOdMm / (2 * tokenRadiusPx) : null;

  // Contour pipeline (pure, live): smoothed outline → clearance offset (px for the overlay),
  // then the mm footprint that hollows the bin. One source of truth, shared by the overlay
  // (px) and the CAD pocket (mm).
  const contour = useMemo(
    () =>
      editedMask
        ? refineContour(editedMask.outline, {
            smoothingFactor: params.smoothingFactor,
            straighten: params.straightenEdges,
            straightenToleranceDeg: params.straightenToleranceDeg,
          })
        : [],
    [editedMask, params.smoothingFactor, params.straightenEdges, params.straightenToleranceDeg],
  );
  const offsetContour = useMemo(() => {
    if (!scaleMmPerPx || contour.length < 3 || params.offsetMm <= 0) return [];
    return offsetPolygon(contour, params.offsetMm / scaleMmPerPx);
  }, [contour, scaleMmPerPx, params.offsetMm]);
  const footprintMm = useMemo(() => {
    const ring = offsetContour.length >= 3 ? offsetContour : contour;
    if (!scaleMmPerPx || ring.length < 3) return null;
    return contourToFootprintMm(ring, scaleMmPerPx);
  }, [offsetContour, contour, scaleMmPerPx]);

  // Build the bin only on the Preview tab. replicad now runs in a worker (see useBin), so the
  // build never freezes the UI; gating just avoids re-cutting while the user paints elsewhere.
  const { geometry, status, exportBin } = useBin(params, footprintMm, tab === 'preview');

  // Auto-size: size the grid so the pocket (object + clearance, in mm) fits the bin's usable
  // INTERIOR — not the hors-tout grid. Sized from the footprint bbox + the inner margin.
  useEffect(() => {
    if (params.manualSize || !footprintMm || footprintMm.length < 3) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of footprintMm) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const fp = gridForFootprint(maxX - minX, maxY - minY, params.pitchMm);
    if (fp && (fp.cols !== params.cols || fp.rows !== params.rows)) {
      setParams((p) => ({ ...p, cols: fp.cols, rows: fp.rows }));
    }
  }, [footprintMm, params.manualSize, params.pitchMm, params.cols, params.rows]);

  const exportFile = async (format: 'stl' | 'step') => {
    const blob = await exportBin(format);
    if (blob) downloadBlob(blob, binFilename(params.cols, params.rows, format));
  };

  // The 1:1 PDF plan needs the calibration scale (no token → no true scale → no 1:1) + a contour.
  const canExportPdf = scaleMmPerPx !== null && contour.length >= 3;
  const exportPdf = async () => {
    if (scaleMmPerPx === null || contour.length < 3) return;
    const toMm = (pts: Point2D[]): Point2D[] => pts.map(([x, y]) => [x * scaleMmPerPx, y * scaleMmPerPx]);
    const objectMm = toMm(contour);
    const pocketMm = offsetContour.length >= 3 ? toMm(offsetContour) : [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of objectMm) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const dims = `${Math.round(maxX - minX)} × ${Math.round(maxY - minY)} mm`;
    const { buildPlanPdf } = await import('../../pdf/plan');
    const loadFont = (url: string) =>
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((b) => new Uint8Array(b));
    const [regular, bold] = await Promise.all([loadFont(interRegularUrl), loadFont(interBoldUrl)]);
    const blob = await buildPlanPdf({
      objectMm,
      pocketMm,
      fonts: { regular, bold },
      labels: {
        title: t('plan.title'),
        dims,
        print: t('plan.print'),
        object: t('plan.object'),
        pocket: t('plan.pocket'),
        ruler: t('plan.ruler'),
        pageWord: t('plan.page'),
      },
    });
    downloadBlob(blob, 'snapfinity-plan-1-1.pdf');
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-800">
      <Header
        onExport={exportFile}
        canExport={status === 'ready'}
        onExportPdf={exportPdf}
        canExportPdf={canExportPdf}
        tab={tab}
        onTabChange={setTab}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
      />
      <main className="grid flex-1 overflow-hidden lg:grid-cols-[340px_1fr]">
        <aside className="overflow-y-auto border-r border-slate-200 bg-white">
          <ControlsPanel
            params={params}
            set={set}
            tab={tab}
            onResetEdits={reset}
            hasEdits={hasEdits}
            frameTool={frameTool}
            onFrameTool={setFrameTool}
            onResetFraming={resetFraming}
            onRotate90={rotate90}
          />
        </aside>
        <section className="relative min-h-0 p-4">
          <div className={tab === 'outline' ? 'h-full' : 'hidden'}>
            <OutlinePanel
              params={params}
              photo={photo}
              derived={editedMask}
              contour={contour}
              offsetContour={offsetContour}
              scaleMmPerPx={scaleMmPerPx}
              onUpload={(file) => {
                reset();
                setPhotoEpoch((e) => e + 1);
                photo.setFile(file);
              }}
              onPaint={paint}
              tool={frameTool === 'none' ? 'brush' : frameTool}
              onStraighten={onStraighten}
              onCrop={onCrop}
              onCancelCrop={() => setFrameTool('none')}
            />
          </div>
          <div className={tab === 'preview' ? 'h-full' : 'hidden'}>
            <Viewer geometry={geometry} status={status} opacity={params.renderOpacity} />
          </div>
        </section>
      </main>
    </div>
  );
}
