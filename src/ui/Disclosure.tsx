import { ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

/**
 * Nested collapsible group inside a `Section` — for advanced / optional controls that should stay
 * out of the way until needed. Closed by default; a dashed rule separates it from the group above.
 */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-2 border-t border-dashed border-slate-200 pt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 transition-colors hover:text-slate-600"
      >
        <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
        {title}
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
}
