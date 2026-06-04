export interface TabItem {
  id: string;
  label: string;
}

/** Segmented control (pill) — used as the global view switch in the header. */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`rounded-[10px] px-4 py-1.5 text-[13px] font-semibold transition-colors ${
              selected ? 'bg-white text-accent-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
