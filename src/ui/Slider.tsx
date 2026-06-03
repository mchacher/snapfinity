import type { CSSProperties } from 'react';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

/** Inline slider: label · track · value (compact, instrument-like). "Fader" style — see index.css. */
export function Slider({ label, value, onChange, min, max, step = 1, unit }: Props) {
  // Filled portion (WebKit): an accent → track gradient at the value %, set as a CSS var the
  // track background reads. Firefox draws the fill natively via ::-moz-range-progress.
  const pct = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;
  const fill = {
    '--slider-fill': `linear-gradient(to right, var(--color-accent-600) 0 ${pct}%, var(--color-slider-track) ${pct}% 100%)`,
  } as CSSProperties;

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
        className="slider min-w-0 flex-1"
        style={fill}
      />
      <span className="w-16 shrink-0 text-right font-mono text-sm text-slate-800">
        {value}
        {unit && <span className="text-slate-400"> {unit}</span>}
      </span>
    </div>
  );
}
