import { Boxes, Download } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Tabs } from '../../ui/Tabs';
import { useI18n, type Lang } from '../../i18n';

interface Props {
  onExport: (format: 'stl' | 'step') => void;
  canExport: boolean;
  /** Export the printable 1:1 top-view PDF plan (needs a calibrated contour). */
  onExportPdf: () => void;
  canExportPdf: boolean;
  tab: 'outline' | 'preview';
  onTabChange: (tab: 'outline' | 'preview') => void;
}

export function Header({ onExport, canExport, onExportPdf, canExportPdf, tab, onTabChange }: Props) {
  const { lang, setLang, t } = useI18n();
  const langs: Lang[] = ['fr', 'en'];

  return (
    <header className="flex items-center border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-white">
          <Boxes size={16} />
        </span>
        <span className="text-sm font-semibold tracking-tight text-slate-800">Snapfinity</span>
        <span className="hidden text-xs text-slate-400 sm:inline">· {t('app.tagline')}</span>
      </div>

      <div className="flex-1" />
      <Tabs
        tabs={[
          { id: 'outline', label: t('tabs.outline') },
          { id: 'preview', label: t('tabs.preview') },
        ]}
        active={tab}
        onChange={(id) => onTabChange(id as 'outline' | 'preview')}
      />
      <div className="flex-1" />

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-2 py-1 uppercase transition-colors ${
                lang === l ? 'bg-white text-accent-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <Button variant="secondary" disabled={!canExportPdf} onClick={onExportPdf}>
          {t('export.pdf')}
        </Button>
        <Button variant="secondary" disabled={!canExport} onClick={() => onExport('step')}>
          {t('export.step')}
        </Button>
        <Button variant="primary" icon={<Download size={15} />} disabled={!canExport} onClick={() => onExport('stl')}>
          {t('export.stl')}
        </Button>
      </div>
    </header>
  );
}
