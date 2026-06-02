import { useEffect, useState } from 'react';
import { Header } from './Header';
import { ControlsPanel } from './ControlsPanel';
import { Viewer } from './Viewer';
import { useBin } from './useBin';
import { usePhotoAnalysis } from './usePhotoAnalysis';
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
  offsetMm: number;
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
  includeLip: true,
  tokenOdMm: 76.2,
};

export function Workspace() {
  const [params, setParams] = useState<Params>(initialParams);
  const set = <K extends keyof Params>(key: K, value: Params[K]) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const { geometry, shape, status } = useBin(params);
  const photo = usePhotoAnalysis();

  // Calibration scale, recomputed from the detected token radius + the OD setting — so
  // changing the OD (or pitch) re-derives the size without re-running the vision pipeline.
  const tokenRadiusPx = photo.result?.token.found ? (photo.result.token.radiusPx ?? null) : null;
  const scaleMmPerPx = tokenRadiusPx ? params.tokenOdMm / (2 * tokenRadiusPx) : null;

  // Auto-size: derive cols/rows from the object bbox × scale, unless the user took over.
  useEffect(() => {
    if (params.manualSize) return;
    const bbox = photo.result?.objectBBoxPx;
    if (!bbox) return;
    const fp = footprintFromBBox(bbox, scaleMmPerPx, params.pitchMm);
    if (fp && (fp.cols !== params.cols || fp.rows !== params.rows)) {
      setParams((p) => ({ ...p, cols: fp.cols, rows: fp.rows }));
    }
  }, [photo.result, scaleMmPerPx, params.manualSize, params.pitchMm, params.cols, params.rows]);

  const exportFile = (format: 'stl' | 'step') => {
    if (!shape) return;
    const blob = format === 'stl' ? shapeToStl(shape) : shapeToStep(shape);
    downloadBlob(blob, binFilename(params.cols, params.rows, format));
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-800">
      <Header onExport={exportFile} canExport={status === 'ready'} />
      <main className="grid flex-1 overflow-hidden lg:grid-cols-[340px_1fr]">
        <aside className="overflow-y-auto border-r border-slate-200 bg-white">
          <ControlsPanel
            params={params}
            set={set}
            photo={photo}
            scaleMmPerPx={scaleMmPerPx}
            onUpload={(file) => photo.analyze(file, params.tokenOdMm)}
          />
        </aside>
        <section className="min-h-[320px] p-4">
          <Viewer geometry={geometry} status={status} />
        </section>
      </main>
    </div>
  );
}
