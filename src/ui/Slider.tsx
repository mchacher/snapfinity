import { useState, type CSSProperties } from 'react';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** Defer `onChange` until the drag is released — the thumb still follows the finger live, but the
   * (possibly heavy) recompute fires once on release instead of at every step, so dragging stays
   * smooth. Use for sliders whose onChange triggers vision/CAD work. */
  commitOnRelease?: boolean;
}

/** Inline slider: label · track · value (compact, instrument-like). "Fader" style — see index.css. */
export function Slider({ label, value, onChange, min, max, step = 1, unit, commitOnRelease }: Props) {
  // While dragging a commit-on-release slider, the thumb follows this local value; `null` means
  // "not dragging" → show the committed `value`.
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = commitOnRelease && dragValue != null ? dragValue : value;
  const commit = () =>
    setDragValue((d) => {
      if (d != null) onChange(d);
      return null;
    });

  // Filled portion (WebKit): an accent → track gradient at the value %, set as a CSS var the
  // track background reads. Firefox draws the fill natively via ::-moz-range-progress.
  const pct = max > min ? Math.max(0, Math.min(100, ((shown - min) / (max - min)) * 100)) : 0;
  const fill = {
    '--slider-fill': `linear-gradient(to right, var(--color-accent-600) 0 ${pct}%, var(--color-slider-track) ${pct}% 100%)`,
  } as CSSProperties;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 text-[13px] text-slate-600">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (commitOnRelease) setDragValue(v);
          else onChange(v);
        }}
        onPointerUp={commitOnRelease ? commit : undefined}
        onKeyUp={commitOnRelease ? commit : undefined}
        onBlur={commitOnRelease ? commit : undefined}
        className="slider min-w-0 flex-1"
        style={fill}
      />
      <span className="w-16 shrink-0 text-right font-mono text-[13px] text-slate-800">
        {shown}
        {unit && <span className="text-slate-400"> {unit}</span>}
      </span>
    </div>
  );
}
