export interface TabItem {
  id: string;
  label: string;
}

/** Flat, underlined tab bar — matches the épuré CAD design system. */
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
    <div role="tablist" className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              selected ? 'text-accent-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {selected && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent-600" />}
          </button>
        );
      })}
    </div>
  );
}
