import type { ReactNode, SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export function Select({ label, children, ...rest }: Props) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-slate-600">{label}</span>
      <select
        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-sm text-slate-800 outline-none focus:border-accent-500"
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}
