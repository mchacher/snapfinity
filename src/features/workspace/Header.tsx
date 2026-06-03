import { Boxes, Download, Undo2, Redo2 } from 'lucide-react';
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
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Header({ onExport, canExport, onExportPdf, canExportPdf, tab, onTabChange, onUndo, onRedo, canUndo, canRedo }: Props) {
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
        <div className="ml-3 flex items-center gap-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title={`${t('header.undo')} (⌘Z)`}
            aria-label={t('header.undo')}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title={`${t('header.redo')} (⌘⇧Z)`}
            aria-label={t('header.redo')}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            <Redo2 size={16} />
          </button>
        </div>
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
