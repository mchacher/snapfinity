import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImageUp, Loader2 } from 'lucide-react';
import { Chip } from '../../ui/Chip';
import { Tabs } from '../../ui/Tabs';
import { Slider } from '../../ui/Slider';
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
  /** A mask re-derive (threshold/method change) is in progress → small spinner on the photo. */
  computing: boolean;
  onUpload: (file: File) => void;
  /** Param setter — the tool options bar (over the photo) writes through it. */
  set: <K extends keyof Params>(key: K, value: Params[K]) => void;
  /** Reset handlers for the tool options bars (Points / Pinceau). */
  onResetContour: () => void;
  onResetEdits: () => void;
  hasEdits: boolean;
  /** Paint a disc into the edit layer (mask-space) — value chosen from the brush mode. */
  onPaint: (maskX: number, maskY: number, maskRadius: number, value: number) => void;
  /** Active tool. `none`/`lissage`/`redresser` = no direct photo interaction (the last two only
   * show their options bar); the others drive the overlay. */
  tool: 'none' | 'brush' | 'straighten' | 'crop' | 'contour' | 'lasso' | 'lissage' | 'redresser';
  /** Editable contour nodes (full-res px) + commit, in `contour` mode (spec 035). */
  editNodes?: Point2D[];
  onEditNodes?: (ring: Point2D[]) => void;
  /** Magnetic lasso (spec 037): closed contour on completion + cancel. */
  onLasso?: (ring: Point2D[]) => void;
  onCancelLasso?: () => void;
  onStraighten: (p1: Point2D, p2: Point2D) => void;
  onCrop: (p1: Point2D, p2: Point2D) => void;
  onCancelCrop: () => void;
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
  computing,
  onUpload,
  set,
  onResetContour,
  onResetEdits,
  hasEdits,
  onPaint,
  tool,
  editNodes,
  onEditNodes,
  onLasso,
  onCancelLasso,
  onStraighten,
  onCrop,
  onCancelCrop,
}: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  // Hold the framed photo's pixels in a ref so the megabyte ImageData is passed to PhotoOverlay
  // by reference, never through React props (a dev-mode reconcile of it froze the UI ~3 s/crop).
  const imageRef = useRef<ImageData | null>(null);
  imageRef.current = photo.framed?.imageData ?? null;
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

  if (photo.framed) {
    const framed = photo.framed;
    // The détourage (mask/contour/token) is only drawn once it matches the displayed framing —
    // while it catches up after a crop/straighten, we show the freshly framed photo on its own.
    const detourage = !photo.framingPending;
    // The active tool's options — shown in a toolbar over the photo (not under the tool in the panel).
    const toolBar =
      // Pinceau + Points keep their options on the photo (interactive tools); Lissage / Redresser
      // are simple settings and live in the left panel.
      tool === 'contour' ? (
        <>
          <span className="text-xs leading-snug text-slate-500">{t('params.contourHint')}</span>
          <button
            type="button"
            onClick={onResetContour}
            className="shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
          >
            {t('params.contourReset')}
          </button>
        </>
      ) : tool === 'brush' ? (
        <>
          <Tabs
            tabs={[
              { id: 'add', label: t('params.brushAdd') },
              { id: 'erase', label: t('params.brushErase') },
            ]}
            active={params.brushMode}
            onChange={(id) => set('brushMode', id as 'add' | 'erase')}
          />
          <div className="w-64">
            <Slider label={t('params.brushSize')} value={params.brushSize} onChange={(v) => set('brushSize', v)} min={5} max={80} step={1} />
          </div>
          <button
            type="button"
            onClick={onResetEdits}
            disabled={!hasEdits}
            className="shrink-0 text-xs font-medium text-accent-700 hover:underline disabled:text-slate-300 disabled:no-underline"
          >
            {t('params.reset')}
          </button>
        </>
      ) : null;
    return (
      <div className="flex h-full flex-col gap-2">
        {/* Real toolbar zone above the photo: token/scale chips + Replace, and the active tool's
            contextual bar (e.g. the brush options) on a second row. */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {photo.result && (
              <Chip tone={photo.result.token.found ? 'ok' : 'warn'}>
                {t('photo.token')} · {photo.result.token.found ? t('photo.tokenFound') : t('photo.tokenMissing')}
              </Chip>
            )}
            {scaleMmPerPx !== null && (
              <Chip tone="neutral">
                {t('photo.scale')} · {scaleMmPerPx.toFixed(3)} mm/px
              </Chip>
            )}
            <span className="flex-1" />
            <button
              type="button"
              onClick={openPicker}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t('photo.replace')}
            </button>
          </div>
          {toolBar && (
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2">{toolBar}</div>
          )}
        </div>
        {/* Photo canvas — fills the rest of the space. */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <PhotoOverlay
            imageRef={imageRef}
            width={framed.width}
            height={framed.height}
            frameKey={photo.framedKey}
            token={detourage ? (photo.result?.token ?? null) : null}
            mask={detourage ? (derived?.mask ?? null) : null}
            bbox={detourage ? (derived?.objectBBoxPx ?? null) : null}
            contour={detourage ? contour : []}
            offsetContour={detourage ? offsetContour : []}
            maskOpacity={params.maskOpacity}
            showGrid={params.showGrid}
            brightness={params.brightness}
            contrast={params.contrast}
            onPaint={(mx, my, mr) => onPaint(mx, my, mr, params.brushMode === 'erase' ? EDIT_ERASE : EDIT_ADD)}
            brushSize={params.brushSize}
            brushErase={params.brushMode === 'erase'}
            tool={tool}
            editNodes={editNodes}
            onEditNodes={onEditNodes}
            onLasso={onLasso}
            onCancelLasso={onCancelLasso}
            onStraighten={onStraighten}
            onCrop={onCrop}
            onCancelCrop={onCancelCrop}
          />
          {/* Centered waiting overlay — for the full analysis AND a threshold/method re-derive. */}
          {(photo.status === 'analyzing' || computing) && <BusyOverlay label={t('photo.detourage')} />}
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
