import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

/** Flat, collapsible sidebar section (no card chrome) — divider at the bottom. */
export function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-700"
      >
        <ChevronDown size={14} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
        {title}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}
