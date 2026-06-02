import { useEffect, useState, type KeyboardEvent } from 'react';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Numeric input that commits on blur / Enter (not every keystroke), clamping to [min, max] and
 * reverting invalid entries — so you can type a value like "36" without it clamping mid-type.
 */
export function NumberField({ label, value, onChange, unit, min, max, step }: Props) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const n = Number(text);
    if (!Number.isFinite(n) || text.trim() === '') {
      setText(String(value));
      return;
    }
    let clamped = n;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    setText(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 focus-within:border-accent-500">
        <input
          type="number"
          value={text}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className="w-14 bg-transparent text-right font-mono text-sm text-slate-800 outline-none"
        />
        {unit && <span className="font-mono text-xs text-slate-400">{unit}</span>}
      </span>
    </label>
  );
}
