import { Box } from 'lucide-react';
import { useI18n } from '../../i18n';

export function ViewerPlaceholder() {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-300">
      <Box size={56} strokeWidth={1} />
      <div className="text-center">
        <div className="text-sm font-medium text-slate-400">{t('viewer.placeholder')}</div>
        <div className="text-xs text-slate-400">{t('viewer.hint')}</div>
      </div>
    </div>
  );
}
