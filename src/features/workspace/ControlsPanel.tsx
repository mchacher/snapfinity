import { Section } from '../../ui/Section';
import { Chip } from '../../ui/Chip';
import { Slider } from '../../ui/Slider';
import { NumberField } from '../../ui/NumberField';
import { Toggle } from '../../ui/Toggle';
import { useI18n } from '../../i18n';
import type { Params } from './Workspace';

const BASE_HEIGHT_MM = 4.75;
const TOP_RISE_MM = 3.38;

interface Props {
  params: Params;
  set: <K extends keyof Params>(key: K, value: Params[K]) => void;
  /** Which tab is active — the left panel shows the tools for that tab. */
  tab: 'outline' | 'preview';
}

/** Left panel — contextual to the active tab: outline tools vs bin parameters. */
export function ControlsPanel({ params, set, tab }: Props) {
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
        <Section title={t('params.image')}>
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
        </Section>
        <Section title={t('tabs.outline')}>
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
      </div>
    );
  }

  const x = Math.round(params.cols * params.pitchMm);
  const y = Math.round(params.rows * params.pitchMm);
  const z = Math.round(BASE_HEIGHT_MM + params.heightUnits * 7 + TOP_RISE_MM);

  return (
    <div>
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
      </Section>
    </div>
  );
}
