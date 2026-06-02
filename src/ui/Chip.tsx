import type { ReactNode } from 'react';

type Tone = 'ok' | 'warn' | 'neutral';

const tones: Record<Tone, string> = {
  ok: 'bg-accent-50 text-accent-700 ring-accent-600/20',
  warn: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function Chip({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
