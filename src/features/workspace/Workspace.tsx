import { useEffect, useState } from 'react';
import { Header } from './Header';
import { ControlsPanel } from './ControlsPanel';
import { OutlinePanel } from './OutlinePanel';
import { Viewer } from './Viewer';
import { useBin } from './useBin';
import { usePhotoAnalysis, useDerivedMask } from './usePhotoAnalysis';
import { binFilename, downloadBlob, shapeToStep, shapeToStl } from '../../cad/export';
import { footprintFromBBox } from '../../core/sizing';

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
  /** Pre-inference image brightness (washes light shadows toward white). */
  brightness: number;
  /** Pre-inference image contrast. */
  contrast: number;
  /** u2netp saliency cut, higher = stricter (drops shadows). */
  detectThreshold: number;
  /** Show the green segmentation tint over the photo. */
  showMask: boolean;
  /** Green tint strength when shown, 0 … 1. */
  maskOpacity: number;
  includeLip: boolean;
  /** Calibration token outer diameter (mm) — measure the printed token for best accuracy. */
  tokenOdMm: number;
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
  brightness: 0,
  contrast: 0,
  detectThreshold: 0.5,
  showMask: true,
  maskOpacity: 0.45,
  includeLip: true,
  tokenOdMm: 76.2,
};

export function Workspace() {
  const [params, setParams] = useState<Params>(initialParams);
  const [tab, setTab] = useState<'outline' | 'preview'>('outline');
  const set = <K extends keyof Params>(key: K, value: Params[K]) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const { geometry, shape, status } = useBin(params);
  const photo = usePhotoAnalysis({ brightness: params.brightness, contrast: params.contrast });
  const derived = useDerivedMask(photo.result, params.detectThreshold);

  // Calibration scale, recomputed from the detected token radius + the OD setting — so
  // changing the OD (or pitch) re-derives the size without re-running the vision pipeline.
  const tokenRadiusPx = photo.result?.token.found ? (photo.result.token.radiusPx ?? null) : null;
  const scaleMmPerPx = tokenRadiusPx ? params.tokenOdMm / (2 * tokenRadiusPx) : null;

  // Auto-size: derive cols/rows from the object bbox × scale, unless the user took over.
  useEffect(() => {
    if (params.manualSize) return;
    const bbox = derived?.objectBBoxPx;
    if (!bbox) return;
    const fp = footprintFromBBox(bbox, scaleMmPerPx, params.pitchMm);
    if (fp && (fp.cols !== params.cols || fp.rows !== params.rows)) {
      setParams((p) => ({ ...p, cols: fp.cols, rows: fp.rows }));
    }
  }, [derived, scaleMmPerPx, params.manualSize, params.pitchMm, params.cols, params.rows]);

  const exportFile = (format: 'stl' | 'step') => {
    if (!shape) return;
    const blob = format === 'stl' ? shapeToStl(shape) : shapeToStep(shape);
    downloadBlob(blob, binFilename(params.cols, params.rows, format));
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-800">
      <Header
        onExport={exportFile}
        canExport={status === 'ready'}
        tab={tab}
        onTabChange={setTab}
      />
      <main className="grid flex-1 overflow-hidden lg:grid-cols-[340px_1fr]">
        <aside className="overflow-y-auto border-r border-slate-200 bg-white">
          <ControlsPanel params={params} set={set} tab={tab} />
        </aside>
        <section className="relative min-h-0 p-4">
          <div className={tab === 'outline' ? 'h-full' : 'hidden'}>
            <OutlinePanel
              params={params}
              photo={photo}
              derived={derived}
              scaleMmPerPx={scaleMmPerPx}
              onUpload={(file) => photo.setFile(file)}
            />
          </div>
          <div className={tab === 'preview' ? 'h-full' : 'hidden'}>
            <Viewer geometry={geometry} status={status} />
          </div>
        </section>
      </main>
    </div>
  );
}
