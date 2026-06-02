import { useEffect, useMemo, useState } from 'react';
import { Header } from './Header';
import { ControlsPanel } from './ControlsPanel';
import { OutlinePanel } from './OutlinePanel';
import { Viewer } from './Viewer';
import { useBin } from './useBin';
import { usePhotoAnalysis, useDerivedMask } from './usePhotoAnalysis';
import { useMaskEdit } from './useMaskEdit';
import { binFilename, downloadBlob } from '../../cad/export';
import { gridForFootprint } from '../../core/sizing';
import { smoothContour } from '../../core/contour';
import { offsetPolygon, type Point2D } from '../../core/offset';
import { contourToFootprintMm } from '../../core/footprint';
import { useI18n } from '../../i18n';

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
  brushMode: 'add',
  brushSize: 24,
  showMask: true,
  maskOpacity: 0.45,
  includeLip: true,
  tokenOdMm: 76.2,
  renderOpacity: 1,
};

export function Workspace() {
  const { t } = useI18n();
  const [params, setParams] = useState<Params>(initialParams);
  const [tab, setTab] = useState<'outline' | 'preview'>('outline');
  const set = <K extends keyof Params>(key: K, value: Params[K]) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const photo = usePhotoAnalysis({
    flatten: params.flattenStrength,
    brightness: params.brightness,
    contrast: params.contrast,
  });
  const derived = useDerivedMask(photo.result, params.detectThreshold);
  const { editedMask, hasEdits, paint, reset } = useMaskEdit(
    derived,
    photo.result?.width ?? 0,
    photo.result?.height ?? 0,
  );

  // Calibration scale, recomputed from the detected token radius + the OD setting — so
  // changing the OD (or pitch) re-derives the size without re-running the vision pipeline.
  const tokenRadiusPx = photo.result?.token.found ? (photo.result.token.radiusPx ?? null) : null;
  const scaleMmPerPx = tokenRadiusPx ? params.tokenOdMm / (2 * tokenRadiusPx) : null;

  // Contour pipeline (pure, live): smoothed outline → clearance offset (px for the overlay),
  // then the mm footprint that hollows the bin. One source of truth, shared by the overlay
  // (px) and the CAD pocket (mm).
  const contour = useMemo(
    () => (editedMask ? smoothContour(editedMask.outline, params.smoothingFactor) : []),
    [editedMask, params.smoothingFactor],
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
    const blob = await buildPlanPdf({
      objectMm,
      pocketMm,
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
      />
      <main className="grid flex-1 overflow-hidden lg:grid-cols-[340px_1fr]">
        <aside className="overflow-y-auto border-r border-slate-200 bg-white">
          <ControlsPanel params={params} set={set} tab={tab} onResetEdits={reset} hasEdits={hasEdits} />
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
                photo.setFile(file);
              }}
              onPaint={paint}
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
