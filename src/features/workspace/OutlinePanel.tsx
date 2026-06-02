import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImageUp, Loader2 } from 'lucide-react';
import { Chip } from '../../ui/Chip';
import { BusyOverlay } from '../../ui/BusyOverlay';
import { PhotoOverlay } from './PhotoOverlay';
import { useI18n } from '../../i18n';
import { EDIT_ADD, EDIT_ERASE } from '../../vision/mask-edit';
import type { DerivedMask } from '../../vision/analyze';
import type { Point2D } from '../../core/offset';
import type { Params } from './Workspace';
import type { PhotoAnalysisState } from './usePhotoAnalysis';

interface Props {
  params: Params;
  photo: PhotoAnalysisState;
  derived: DerivedMask | null;
  /** Smoothed contour + clearance offset (full-res px) — computed in Workspace, drawn here. */
  contour: Point2D[];
  offsetContour: Point2D[];
  scaleMmPerPx: number | null;
  onUpload: (file: File) => void;
  /** Paint a disc into the edit layer (mask-space) — value chosen from the brush mode. */
  onPaint: (maskX: number, maskY: number, maskRadius: number, value: number) => void;
}

/**
 * The "Outline" tab: the photo at a workable size with the detection/segmentation overlay
 * (mask tint, token circle, smoothed contour + clearance offset) + the mask brush. The contour
 * is computed in Workspace (shared with the CAD pocket); the controls live in the left panel.
 */
export function OutlinePanel({
  params,
  photo,
  derived,
  contour,
  offsetContour,
  scaleMmPerPx,
  onUpload,
  onPaint,
}: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

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

  if (photo.result) {
    return (
      <div className="relative h-full">
        <div className="absolute inset-x-3 top-3 z-10 flex flex-wrap items-center gap-2">
          <Chip tone={photo.result.token.found ? 'ok' : 'warn'}>
            {t('photo.token')} · {photo.result.token.found ? t('photo.tokenFound') : t('photo.tokenMissing')}
          </Chip>
          {scaleMmPerPx !== null && (
            <Chip tone="neutral">
              {t('photo.scale')} · {scaleMmPerPx.toFixed(3)} mm/px
            </Chip>
          )}
          <span className="flex-1" />
          <button
            type="button"
            onClick={openPicker}
            className="rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            {t('photo.replace')}
          </button>
        </div>
        <div className="flex h-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <PhotoOverlay
            analysis={photo.result}
            mask={derived?.mask ?? null}
            bbox={derived?.objectBBoxPx ?? null}
            contour={contour}
            offsetContour={offsetContour}
            maskOpacity={params.showMask ? params.maskOpacity : 0}
            brightness={params.brightness}
            contrast={params.contrast}
            onPaint={(mx, my, mr) => onPaint(mx, my, mr, params.brushMode === 'erase' ? EDIT_ERASE : EDIT_ADD)}
            brushSize={params.brushSize}
            brushErase={params.brushMode === 'erase'}
          />
        </div>
        {photo.status === 'analyzing' && <BusyOverlay label={t('photo.analyzing')} />}
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
