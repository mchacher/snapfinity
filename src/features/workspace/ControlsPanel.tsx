import type { ReactNode } from 'react';
import { ArrowRight, Brush, Crop, Eraser, Lasso, PenLine, Ruler, Wand2 } from 'lucide-react';
import { Section } from '../../ui/Section';
import { Chip } from '../../ui/Chip';
import { Slider } from '../../ui/Slider';
import { NumberField } from '../../ui/NumberField';
import { Toggle } from '../../ui/Toggle';
import { Tabs } from '../../ui/Tabs';
import { useI18n } from '../../i18n';
import type { Params, FrameTool } from './Workspace';

/**
 * Subsection inside a (blue) Section: a slate heading + its controls slightly **indented** behind a
 * hairline, so groups read as a clear tree below the accent section header.
 */
function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 first:mt-1">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="ml-1 border-l-2 border-slate-100 pl-3">{children}</div>
    </div>
  );
}

/** A selectable tool as a Cadrage-style row: name on the left, a small icon toggle button (same
 * footprint as the Angle ruler) aligned to the right. */
function AdjustTool({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 shrink-0 text-[13px] text-slate-600">{label}</span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        title={label}
        aria-label={label}
        className={`flex items-center justify-center rounded-md border px-5 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          active ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
      >
        {icon}
      </button>
    </div>
  );
}

const BASE_HEIGHT_MM = 4.75;
const TOP_RISE_MM = 3.38;

interface Props {
  params: Params;
  set: <K extends keyof Params>(key: K, value: Params[K]) => void;
  /** Which tab is active — the left panel shows the tools for that tab. */
  tab: 'outline' | 'preview';
  /** Active photo framing tool + setters. */
  frameTool: FrameTool;
  onFrameTool: (tool: FrameTool) => void;
  onResetFraming: () => void;
  /** Quarter-turn the photo (−90° left / +90° right). */
  onRotate90: (dir: -1 | 1) => void;
  /** Contour editor (spec 035). */
  canEditContour: boolean;
  editingContour: boolean;
  onEditContour: () => void;
  onDoneContour: () => void;
  /** Magnetic lasso (spec 037) — armed via the frame tool; enabled once a photo is loaded. */
  canLasso: boolean;
  /** Magic wand / selection (spec 039): run the auto segmentation on demand, + clear the selection. */
  canMagicWand: boolean;
  onMagicWand: () => void;
  hasSelection: boolean;
  /** A mask exists (auto OR rasterized from a lasso) → the Ajuster tools all apply. */
  hasMask: boolean;
  /** The mask came from auto detection (not a lasso) → only then is the method step relevant. */
  isAutoMask: boolean;
  /** The detection method actually in use (Auto resolves to one) — so we present the active one. */
  activeMethod?: 'standard' | 'edges';
  /** Selection wizard step (auto path): validate the method before unlocking the adjust tools. */
  selectionStep: 'method' | 'adjust';
  onMethodNext: () => void;
  onClearSelection: () => void;
}

/** Left panel — contextual to the active tab: outline tools vs bin parameters. */
export function ControlsPanel({
  params,
  set,
  tab,
  frameTool,
  onFrameTool,
  onResetFraming,
  onRotate90,
  canEditContour,
  editingContour,
  onEditContour,
  onDoneContour,
  canLasso,
  canMagicWand,
  onMagicWand,
  hasSelection,
  hasMask,
  isAutoMask,
  activeMethod,
  selectionStep,
  onMethodNext,
  onClearSelection,
}: Props) {
  const { t } = useI18n();

  if (tab === 'outline') {
    return (
      <div>
        {/* ── IMAGE: the photo itself — frame it, then adjust its look ────────────────────── */}
        <Section title={t('params.image')}>
          <SubSection title={t('params.framing')}>
            <div className="flex items-center gap-3 py-1.5">
              <span className="w-24 shrink-0 text-[13px] text-slate-600">{t('params.rotate')}</span>
              <span className="flex-1" />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onRotate90(-1)}
                  className="rounded-md border border-slate-200 px-5 py-1.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50"
                >
                  ↺ 90°
                </button>
                <button
                  type="button"
                  onClick={() => onRotate90(1)}
                  className="rounded-md border border-slate-200 px-5 py-1.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50"
                >
                  ↻ 90°
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 py-1.5">
              <span className="w-24 shrink-0 text-[13px] text-slate-600">{t('params.cropTool')}</span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => onFrameTool(frameTool === 'crop' ? 'none' : 'crop')}
                title={t('params.cropTool')}
                aria-label={t('params.cropTool')}
                aria-pressed={frameTool === 'crop'}
                className={`flex items-center justify-center rounded-md border px-5 py-1.5 transition-colors ${
                  frameTool === 'crop'
                    ? 'border-accent-600 bg-accent-50 text-accent-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Crop size={14} />
              </button>
            </div>
            {frameTool === 'crop' && <p className="text-[11px] text-slate-400">{t('params.cropHint')}</p>}
            <NumberField
              label={t('params.angle')}
              value={params.straightenDeg}
              onChange={(v) => set('straightenDeg', v)}
              unit="°"
              min={-180}
              max={180}
              step={0.1}
              action={
                <button
                  type="button"
                  onClick={() => onFrameTool(frameTool === 'straighten' ? 'none' : 'straighten')}
                  title={t('params.straightenRule')}
                  aria-label={t('params.straightenRule')}
                  aria-pressed={frameTool === 'straighten'}
                  className={`flex items-center justify-center rounded-md border px-5 py-1.5 transition-colors ${
                    frameTool === 'straighten'
                      ? 'border-accent-600 bg-accent-50 text-accent-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Ruler size={14} />
                </button>
              }
            />
            {frameTool === 'straighten' && <p className="text-[11px] text-slate-400">{t('params.straightenHint')}</p>}
            {/* Alignment grid — a framing aid, so it lives with Cadrage. */}
            <Toggle label={t('params.grid')} checked={params.showGrid} onChange={(v) => set('showGrid', v)} />
            {/* Reset is a trailing action — at the very bottom of the subsection. */}
            <button
              type="button"
              onClick={onResetFraming}
              disabled={params.straightenDeg === 0 && !params.cropRect}
              className="mt-2 text-[11px] font-medium text-accent-700 hover:underline disabled:text-slate-300 disabled:no-underline"
            >
              {t('params.resetFraming')}
            </button>
          </SubSection>

          <SubSection title={t('params.adjustments')}>
            <Slider
              label={t('params.flatten')}
              value={params.flattenStrength}
              onChange={(v) => set('flattenStrength', v)}
              min={0}
              max={1}
              step={0.05}
            />
            <Slider
              label={t('params.brightness')}
              value={params.brightness}
              onChange={(v) => set('brightness', v)}
              min={-80}
              max={80}
              step={5}
            />
            <Slider
              label={t('params.contrast')}
              value={params.contrast}
              onChange={(v) => set('contrast', v)}
              min={-80}
              max={80}
              step={5}
            />
          </SubSection>
        </Section>

        {/* ── DÉTOURAGE: scale, then a method → refine by hand ───────────────────────────── */}
        <Section title={t('tabs.outline')}>
          <SubSection title={t('photo.calibration')}>
            <NumberField
              label={t('photo.tokenOd')}
              value={params.tokenOdMm}
              onChange={(v) => set('tokenOdMm', v)}
              unit="mm"
              min={1}
              step={0.1}
            />
          </SubSection>

          {/* Selection (spec 039) — the section title IS the current step (no redundant inner
              header): Créer → Méthode → Ajuster. */}
          <SubSection
            title={
              !hasSelection
                ? t('params.selCreate')
                : isAutoMask && selectionStep === 'method'
                  ? t('params.methodStep')
                  : t('params.selAdjust')
            }
          >
            {!hasSelection ? (
              <>
                {/* One primary action: detect (with Auto). The user then tries the methods on the
                    result, in Ajuster. */}
                <button
                  type="button"
                  onClick={onMagicWand}
                  disabled={!canMagicWand}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent-300 bg-accent-50 py-2 text-[13px] font-semibold text-accent-700 transition-colors hover:bg-accent-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Wand2 size={15} /> {t('params.magicDetect')}
                </button>
                <button
                  type="button"
                  onClick={() => onFrameTool(frameTool === 'lasso' ? 'none' : 'lasso')}
                  disabled={!canLasso}
                  aria-pressed={frameTool === 'lasso'}
                  className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    frameTool === 'lasso'
                      ? 'border-accent-300 bg-accent-50 text-accent-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Lasso size={15} /> {t('params.selManualStart')}
                </button>
                {frameTool === 'lasso' && <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{t('params.lassoHint')}</p>}
              </>
            ) : isAutoMask && selectionStep === 'method' ? (
              /* STEP 2 — choose the detection method (present the active one, no "Auto"), then
                 continue to unlock the adjustment tools. */
              <>
                <Tabs
                  tabs={[
                    { id: 'standard', label: t('params.segStandard') },
                    { id: 'edges', label: t('params.segEdges') },
                  ]}
                  active={activeMethod ?? 'standard'}
                  onChange={(id) => set('segmentMode', id as Params['segmentMode'])}
                />
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{t('params.methodInvite')}</p>
                {/* The threshold only drives the Standard (saliency) route — Contours (edges) ignores
                    it, so we hide it there. Commit-on-release keeps the drag smooth. */}
                {activeMethod !== 'edges' && (
                  <Slider
                    label={t('params.threshold')}
                    value={params.detectThreshold}
                    onChange={(v) => set('detectThreshold', v)}
                    min={0.3}
                    max={0.8}
                    step={0.05}
                    commitOnRelease
                  />
                )}
                <button
                  type="button"
                  onClick={onMethodNext}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent-600 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-700"
                >
                  {t('params.selNext')} <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Eraser size={14} /> {t('params.clearSelection')}
                </button>
              </>
            ) : (
              /* STEP 3 — adjust: each control is a selectable tool (same row UI as Pivoter/Rogner);
                 the active tool's config appears just below it. */
              <>
                {/* Tools — name left + small button right. Points + Pinceau are photo tools (the
                    brush's options show over the photo). Lissage + Redresser are inline settings. */}
                <AdjustTool
                  label={t('params.toolPoints')}
                  icon={<PenLine size={15} />}
                  active={editingContour}
                  disabled={!canEditContour}
                  onClick={editingContour ? onDoneContour : onEditContour}
                />
                {hasMask && (
                  <>
                    <AdjustTool
                      label={t('params.brush')}
                      icon={<Brush size={15} />}
                      active={frameTool === 'brush'}
                      onClick={() => onFrameTool(frameTool === 'brush' ? 'none' : 'brush')}
                    />
                    <Slider
                      label={t('params.smoothing')}
                      value={params.smoothingFactor}
                      onChange={(v) => set('smoothingFactor', v)}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                    {/* Redresser: one slider — 0 = don't straighten, higher = stronger. */}
                    <Slider
                      label={t('params.straighten')}
                      value={params.straightenToleranceDeg}
                      onChange={(v) => set('straightenToleranceDeg', v)}
                      min={0}
                      max={20}
                      step={1}
                      unit="°"
                    />
                    {/* Jeu (clearance) — a détourage setting, now here in Ajuster. */}
                    <Slider
                      label={t('params.offset')}
                      value={params.offsetMm}
                      onChange={(v) => set('offsetMm', v)}
                      min={0}
                      max={3}
                      step={0.1}
                      unit="mm"
                    />
                    {/* Green-mask opacity (0 = hidden) — replaces the old show/hide toggle. */}
                    <Slider
                      label={t('params.opacity')}
                      value={params.maskOpacity}
                      onChange={(v) => set('maskOpacity', v)}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={onClearSelection}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Eraser size={14} /> {t('params.clearSelection')}
                </button>
              </>
            )}
          </SubSection>

        </Section>
      </div>
    );
  }

  const x = Math.round(params.cols * params.pitchMm);
  const y = Math.round(params.rows * params.pitchMm);
  const z = Math.round(BASE_HEIGHT_MM + params.heightUnits * 7 + TOP_RISE_MM);

  return (
    <div>
      <Section title={t('params.sizeSection')}>
        <NumberField
          label={t('params.pitch')}
          value={params.pitchMm}
          onChange={(v) => set('pitchMm', v)}
          min={20}
          max={84}
          step={1}
          unit="mm"
        />

        <div className="flex items-center justify-between gap-2 py-1.5">
          <span className="text-[13px] text-slate-600">{t('params.size')}</span>
          <span className="flex items-center gap-2">
            {!params.manualSize && <Chip tone="neutral">{t('params.auto')}</Chip>}
            <span className="font-mono text-[13px] text-slate-800">
              {params.cols} × {params.rows}
            </span>
          </span>
        </div>
        <Toggle label={t('params.adjust')} checked={params.manualSize} onChange={(v) => set('manualSize', v)} />
        {params.manualSize && (
          <div className="mt-1 rounded-lg bg-slate-50 px-3 ring-1 ring-slate-200">
            <Slider label={t('params.cols')} value={params.cols} onChange={(v) => set('cols', v)} min={1} max={8} />
            <Slider label={t('params.rows')} value={params.rows} onChange={(v) => set('rows', v)} min={1} max={8} />
          </div>
        )}

        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
          <div className="mb-1 text-[11px] font-medium text-slate-400">{t('params.dimensions')}</div>
          <div className="flex gap-4 font-mono text-[13px] text-slate-400">
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
        <Toggle label={t('params.lip')} checked={params.includeLip} onChange={(v) => set('includeLip', v)} />
        <Toggle label={t('params.grip')} checked={params.gripNotches} onChange={(v) => set('gripNotches', v)} />
        {params.gripNotches && (
          <>
            <Slider
              label={t('params.gripSize')}
              value={params.notchRadiusMm}
              onChange={(v) => set('notchRadiusMm', v)}
              min={5}
              max={15}
              step={0.5}
              unit="mm"
            />
            <Slider
              label={t('params.gripX')}
              value={params.notchOffsetXMm}
              onChange={(v) => set('notchOffsetXMm', v)}
              min={-60}
              max={60}
              step={1}
              unit="mm"
            />
            <Slider
              label={t('params.gripY')}
              value={params.notchOffsetYMm}
              onChange={(v) => set('notchOffsetYMm', v)}
              min={-120}
              max={120}
              step={1}
              unit="mm"
            />
          </>
        )}
      </Section>

      <Section title={t('params.render')}>
        <Slider
          label={t('params.opacity')}
          value={params.renderOpacity}
          onChange={(v) => set('renderOpacity', v)}
          min={0.2}
          max={1}
          step={0.05}
        />
      </Section>
    </div>
  );
}
