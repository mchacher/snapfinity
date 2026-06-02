interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({ label, value, onChange, unit, min, max, step }: Props) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 focus-within:border-accent-500">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-14 bg-transparent text-right font-mono text-sm text-slate-800 outline-none"
        />
        {unit && <span className="font-mono text-xs text-slate-400">{unit}</span>}
      </span>
    </label>
  );
}
