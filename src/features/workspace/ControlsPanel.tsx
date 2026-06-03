import { Crop, Ruler } from 'lucide-react';
import { Section } from '../../ui/Section';
import { Chip } from '../../ui/Chip';
import { Slider } from '../../ui/Slider';
import { NumberField } from '../../ui/NumberField';
import { Toggle } from '../../ui/Toggle';
import { Tabs } from '../../ui/Tabs';
import { useI18n } from '../../i18n';
import type { Params, FrameTool } from './Workspace';

const BASE_HEIGHT_MM = 4.75;
const TOP_RISE_MM = 3.38;

interface Props {
  params: Params;
  set: <K extends keyof Params>(key: K, value: Params[K]) => void;
  /** Which tab is active — the left panel shows the tools for that tab. */
  tab: 'outline' | 'preview';
  onResetEdits: () => void;
  hasEdits: boolean;
  /** Active photo framing tool + setters. */
  frameTool: FrameTool;
  onFrameTool: (tool: FrameTool) => void;
  onResetFraming: () => void;
  /** Quarter-turn the photo (−90° left / +90° right). */
  onRotate90: (dir: -1 | 1) => void;
}

/** Left panel — contextual to the active tab: outline tools vs bin parameters. */
export function ControlsPanel({ params, set, tab, onResetEdits, hasEdits, frameTool, onFrameTool, onResetFraming, onRotate90 }: Props) {
  const { t } = useI18n();

  if (tab === 'outline') {
    return (
      <div>
        <Section title={t('photo.calibration')}>
          <NumberField
            label={t('photo.tokenOd')}
            value={params.tokenOdMm}
            onChange={(v) => set('tokenOdMm', v)}
            unit="mm"
            min={1}
            step={0.1}
          />
        </Section>
        <Section title={t('params.framing')}>
          <div className="flex items-center gap-3 py-1.5">
            <span className="w-28 shrink-0 text-sm text-slate-600">{t('params.rotate')}</span>
            <div className="flex flex-1 gap-1.5">
              <button
                type="button"
                onClick={() => onRotate90(-1)}
                className="flex-1 rounded-lg border border-slate-200 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                ↺ 90°
              </button>
              <button
                type="button"
                onClick={() => onRotate90(1)}
                className="flex-1 rounded-lg border border-slate-200 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                ↻ 90°
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 py-1.5">
            <span className="w-28 shrink-0 text-sm text-slate-600">{t('params.cropTool')}</span>
            <div className="flex flex-1">
              <button
                type="button"
                onClick={() => onFrameTool(frameTool === 'crop' ? 'none' : 'crop')}
                title={t('params.cropTool')}
                aria-label={t('params.cropTool')}
                aria-pressed={frameTool === 'crop'}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-1.5 text-sm transition-colors ${
                  frameTool === 'crop'
                    ? 'border-accent-600 bg-accent-50 text-accent-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Crop size={15} />
              </button>
            </div>
          </div>
          {frameTool === 'crop' && <p className="text-xs text-slate-400">{t('params.cropHint')}</p>}
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
                className={`rounded-md border p-1.5 transition-colors ${
                  frameTool === 'straighten'
                    ? 'border-accent-600 bg-accent-50 text-accent-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Ruler size={14} />
              </button>
            }
          />
          {frameTool === 'straighten' && <p className="text-xs text-slate-400">{t('params.straightenHint')}</p>}
          <button
            type="button"
            onClick={onResetFraming}
            disabled={params.straightenDeg === 0 && !params.cropRect}
            className="mt-1 text-xs font-medium text-accent-700 hover:underline disabled:text-slate-300 disabled:no-underline"
          >
            {t('params.resetFraming')}
          </button>
        </Section>
        <Section title={t('params.image')}>
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
        </Section>
        <Section title={t('params.display')}>
          <Toggle label={t('params.maskShow')} checked={params.showMask} onChange={(v) => set('showMask', v)} />
          {params.showMask && (
            <Slider
              label={t('params.opacity')}
              value={params.maskOpacity}
              onChange={(v) => set('maskOpacity', v)}
              min={0}
              max={1}
              step={0.05}
            />
          )}
          <Toggle label={t('params.grid')} checked={params.showGrid} onChange={(v) => set('showGrid', v)} />
        </Section>
        <Section title={t('tabs.outline')}>
          <div className="mb-3">
            <span className="mb-1 block text-sm text-slate-600">{t('params.segment')}</span>
            <Tabs
              tabs={[
                { id: 'auto', label: t('params.segAuto') },
                { id: 'standard', label: t('params.segStandard') },
                { id: 'edges', label: t('params.segEdges') },
              ]}
              active={params.segmentMode}
              onChange={(id) => set('segmentMode', id as Params['segmentMode'])}
            />
          </div>
          <Slider
            label={t('params.threshold')}
            value={params.detectThreshold}
            onChange={(v) => set('detectThreshold', v)}
            min={0.3}
            max={0.8}
            step={0.05}
          />
          <Slider
            label={t('params.smoothing')}
            value={params.smoothingFactor}
            onChange={(v) => set('smoothingFactor', v)}
            min={0}
            max={1}
            step={0.05}
          />
          <Toggle
            label={t('params.straighten')}
            checked={params.straightenEdges}
            onChange={(v) => set('straightenEdges', v)}
          />
          {params.straightenEdges && (
            <Slider
              label={t('params.straightenTol')}
              value={params.straightenToleranceDeg}
              onChange={(v) => set('straightenToleranceDeg', v)}
              min={1}
              max={20}
              step={1}
              unit="°"
            />
          )}
          <Slider
            label={t('params.offset')}
            value={params.offsetMm}
            onChange={(v) => set('offsetMm', v)}
            min={0}
            max={3}
            step={0.1}
            unit="mm"
          />
        </Section>
        <Section title={t('params.brush')}>
          <div className="mb-3">
            <Tabs
              tabs={[
                { id: 'add', label: t('params.brushAdd') },
                { id: 'erase', label: t('params.brushErase') },
              ]}
              active={params.brushMode}
              onChange={(id) => set('brushMode', id as 'add' | 'erase')}
            />
          </div>
          <Slider
            label={t('params.brushSize')}
            value={params.brushSize}
            onChange={(v) => set('brushSize', v)}
            min={5}
            max={80}
            step={1}
          />
          <button
            type="button"
            onClick={onResetEdits}
            disabled={!hasEdits}
            className="mt-1 text-xs font-medium text-accent-700 hover:underline disabled:text-slate-300 disabled:no-underline"
          >
            {t('params.reset')}
          </button>
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
          <span className="text-sm text-slate-600">{t('params.size')}</span>
          <span className="flex items-center gap-2">
            {!params.manualSize && <Chip tone="neutral">{t('params.auto')}</Chip>}
            <span className="font-mono text-sm text-slate-800">
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
