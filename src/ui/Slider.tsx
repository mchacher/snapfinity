interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

/** Inline slider: label · track · value (compact, instrument-like). */
export function Slider({ label, value, onChange, min, max, step = 1, unit }: Props) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 text-sm text-slate-600">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 min-w-0 flex-1 accent-accent-600"
      />
      <span className="w-16 shrink-0 text-right font-mono text-sm text-slate-800">
        {value}
        {unit && <span className="text-slate-400"> {unit}</span>}
      </span>
    </div>
  );
}
