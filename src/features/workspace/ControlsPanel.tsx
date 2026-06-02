import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImageUp, Loader2 } from 'lucide-react';
import { Section } from '../../ui/Section';
import { Chip } from '../../ui/Chip';
import { Slider } from '../../ui/Slider';
import { NumberField } from '../../ui/NumberField';
import { Toggle } from '../../ui/Toggle';
import { PhotoOverlay } from './PhotoOverlay';
import { useI18n } from '../../i18n';
import type { Params } from './Workspace';
import type { PhotoAnalysisState } from './usePhotoAnalysis';

const BASE_HEIGHT_MM = 4.75;
const TOP_RISE_MM = 3.38;

interface Props {
  params: Params;
  set: <K extends keyof Params>(key: K, value: Params[K]) => void;
  photo: PhotoAnalysisState;
  scaleMmPerPx: number | null;
  onUpload: (file: File) => void;
}

export function ControlsPanel({ params, set, photo, scaleMmPerPx, onUpload }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const x = Math.round(params.cols * params.pitchMm);
  const y = Math.round(params.rows * params.pitchMm);
  const z = Math.round(BASE_HEIGHT_MM + params.heightUnits * 7 + TOP_RISE_MM);

  const openPicker = () => inputRef.current?.click();
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };
  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div>
      <Section title={t('photo.title')}>
        {photo.status === 'ready' && photo.result ? (
          <div className="flex flex-col gap-2">
            <PhotoOverlay analysis={photo.result} />
            <div className="flex flex-wrap gap-1.5">
              <Chip tone={photo.result.token.found ? 'ok' : 'warn'}>
                {t('photo.token')} · {photo.result.token.found ? t('photo.tokenFound') : t('photo.tokenMissing')}
              </Chip>
              {scaleMmPerPx !== null && (
                <Chip tone="neutral">
                  {t('photo.scale')} · {scaleMmPerPx.toFixed(3)} mm/px
                </Chip>
              )}
            </div>
            <NumberField
              label={t('photo.tokenOd')}
              value={params.tokenOdMm}
              onChange={(v) => set('tokenOdMm', v)}
              unit="mm"
              min={1}
              step={0.1}
            />
            <button type="button" onClick={openPicker} className="self-start text-xs text-accent-700 hover:underline">
              {t('photo.replace')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-slate-400 transition-colors ${
              dragging ? 'border-accent-500 bg-accent-50' : 'border-slate-300 bg-slate-50'
            }`}
          >
            {photo.status === 'analyzing' ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                <span className="text-xs">{t('photo.analyzing')}</span>
              </>
            ) : photo.status === 'error' ? (
              <>
                <ImageUp size={22} />
                <span className="px-6 text-center text-xs text-amber-600">{t('photo.error')}</span>
                <span className="px-6 text-center text-xs">{t('photo.retry')}</span>
              </>
            ) : (
              <>
                <ImageUp size={22} />
                <span className="px-6 text-center text-xs">{t('photo.drop')}</span>
                <span className="px-6 text-center text-[11px] text-slate-400">{t('photo.hint')}</span>
              </>
            )}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      </Section>

      <Section title={t('params.sizeSection')}>
        <Slider
          label={t('params.pitch')}
          value={params.pitchMm}
          onChange={(v) => set('pitchMm', v)}
          min={20}
          max={84}
          unit="mm"
        />

        <div className="flex items-center gap-3 py-1.5">
          <span className="w-28 shrink-0 text-sm text-slate-600">{t('params.size')}</span>
          <span className="flex flex-1 items-center gap-2">
            <span className="font-mono text-sm text-slate-800">
              {params.cols} × {params.rows}
            </span>
            {!params.manualSize && <Chip tone="neutral">{t('params.auto')}</Chip>}
          </span>
        </div>
        <Toggle
          label={t('params.adjust')}
          checked={params.manualSize}
          onChange={(v) => set('manualSize', v)}
        />
        {params.manualSize && (
          <div className="mt-1 rounded-lg bg-slate-50 px-3 ring-1 ring-slate-200">
            <Slider label={t('params.cols')} value={params.cols} onChange={(v) => set('cols', v)} min={1} max={8} />
            <Slider label={t('params.rows')} value={params.rows} onChange={(v) => set('rows', v)} min={1} max={8} />
          </div>
        )}

        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
          <div className="mb-1 text-xs font-medium text-slate-400">{t('params.dimensions')}</div>
          <div className="flex gap-4 font-mono text-sm text-slate-400">
            <span>
              X <span className="text-slate-800">{x}</span> mm
            </span>
            <span>
              Y <span className="text-slate-800">{y}</span> mm
            </span>
            <span>
              Z <span className="text-slate-800">{z}</span> mm
            </span>
          </div>
        </div>
      </Section>

      <Section title={t('params.general')}>
        <Slider
          label={t('params.height')}
          value={params.heightUnits}
          onChange={(v) => set('heightUnits', v)}
          min={1}
          max={12}
          unit="u"
        />
        <NumberField
          label={t('params.thickness')}
          value={params.thicknessMm}
          onChange={(v) => set('thicknessMm', v)}
          unit="mm"
          min={1}
          step={0.5}
        />
        <Slider
          label={t('params.offset')}
          value={params.offsetMm}
          onChange={(v) => set('offsetMm', v)}
          min={0}
          max={3}
          step={0.1}
          unit="mm"
        />
        <Toggle label={t('params.lip')} checked={params.includeLip} onChange={(v) => set('includeLip', v)} />
      </Section>
    </div>
  );
}
