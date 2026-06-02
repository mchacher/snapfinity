import { useState } from 'react';
import { Header } from './Header';
import { ControlsPanel } from './ControlsPanel';
import { Viewer } from './Viewer';
import { useBin } from './useBin';
import { binFilename, downloadBlob, shapeToStep, shapeToStl } from '../../cad/export';

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
};

export function Workspace() {
  const [params, setParams] = useState<Params>(initialParams);
  const set = <K extends keyof Params>(key: K, value: Params[K]) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const { geometry, shape, status } = useBin(params);

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
          <ControlsPanel params={params} set={set} />
        </aside>
        <section className="min-h-[320px] p-4">
          <Viewer geometry={geometry} status={status} />
        </section>
      </main>
    </div>
  );
}
