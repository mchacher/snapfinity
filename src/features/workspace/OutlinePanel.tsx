import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImageUp, Loader2 } from 'lucide-react';
import { Chip } from '../../ui/Chip';
import { NumberField } from '../../ui/NumberField';
import { Slider } from '../../ui/Slider';
import { PhotoOverlay } from './PhotoOverlay';
import { useI18n } from '../../i18n';
import { smoothContour } from '../../core/contour';
import { offsetPolygon } from '../../core/offset';
import type { Params } from './Workspace';
import type { PhotoAnalysisState } from './usePhotoAnalysis';

interface Props {
  params: Params;
  set: <K extends keyof Params>(key: K, value: Params[K]) => void;
  photo: PhotoAnalysisState;
  scaleMmPerPx: number | null;
  onUpload: (file: File) => void;
}

/**
 * The "Outline" tab: the photo at a workable size with the detection/segmentation overlay.
 * Home for the live contour sliders + mask brush coming in spec 013.
 */
export function OutlinePanel({ params, set, photo, scaleMmPerPx, onUpload }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const result = photo.result;
  // Smoothed outline + clearance offset — pure, recomputed live as the sliders move.
  const contour = useMemo(
    () => (result ? smoothContour(result.outline, params.smoothingFactor) : []),
    [result, params.smoothingFactor],
  );
  const offsetContour = useMemo(() => {
    if (!scaleMmPerPx || contour.length < 3 || params.offsetMm <= 0) return [];
    return offsetPolygon(contour, params.offsetMm / scaleMmPerPx);
  }, [contour, scaleMmPerPx, params.offsetMm]);

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

  const hidden = <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />;

  if (photo.status === 'ready' && photo.result) {
    return (
      <div className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={photo.result.token.found ? 'ok' : 'warn'}>
            {t('photo.token')} · {photo.result.token.found ? t('photo.tokenFound') : t('photo.tokenMissing')}
          </Chip>
          {scaleMmPerPx !== null && (
            <Chip tone="neutral">
              {t('photo.scale')} · {scaleMmPerPx.toFixed(3)} mm/px
            </Chip>
          )}
          <span className="flex-1" />
          <div className="w-40">
            <NumberField
              label={t('photo.tokenOd')}
              value={params.tokenOdMm}
              onChange={(v) => set('tokenOdMm', v)}
              unit="mm"
              min={1}
              step={0.1}
            />
          </div>
          <button type="button" onClick={openPicker} className="text-xs text-accent-700 hover:underline">
            {t('photo.replace')}
          </button>
        </div>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <Slider
            label={t('params.smoothing')}
            value={params.smoothingFactor}
            onChange={(v) => set('smoothingFactor', v)}
            min={0}
            max={1}
            step={0.05}
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
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-3">
          <div className="w-full max-w-3xl">
            <PhotoOverlay analysis={photo.result} contour={contour} offsetContour={offsetContour} />
          </div>
        </div>
        {hidden}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-slate-400 transition-colors ${
          dragging ? 'border-accent-500 bg-accent-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        {photo.status === 'analyzing' ? (
          <>
            <Loader2 size={30} className="animate-spin" />
            <span className="text-sm">{t('photo.analyzing')}</span>
          </>
        ) : photo.status === 'error' ? (
          <>
            <ImageUp size={30} />
            <span className="text-sm text-amber-600">{t('photo.error')}</span>
            <span className="text-sm">{t('photo.retry')}</span>
          </>
        ) : (
          <>
            <ImageUp size={30} />
            <span className="text-sm">{t('photo.drop')}</span>
            <span className="text-xs text-slate-400">{t('photo.hint')}</span>
          </>
        )}
      </button>
      {hidden}
    </>
  );
}
