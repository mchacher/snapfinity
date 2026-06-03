# Spec 028 — slider restyle ("fader") + FR i18n fix

## Overview

Cosmetic polish. The parameter sliders used the **browser-default** `<input type="range">`
(generic OS look, no fill) which the user disliked. Replace with a custom **"fader"** style and
fix a French label.

## Changes

- **Slider** (`src/ui/Slider.tsx` + `src/index.css` `.slider`): a thin **4 px rounded track** with
  an **accent fill** up to the value, and a **vertical rounded-rectangle thumb** (10×22 px, accent,
  white border + soft shadow; darkens on hover) — a precise "fader" look that fits the tool.
  - The unfilled track is a **softer, faintly-azure light gray** (`--color-slider-track #e6ecf4`)
    instead of the harsher slate-200.
  - The fill is driven by `--slider-fill` (an accent→track gradient at the value %, set inline) on
    WebKit; Firefox uses native `::-moz-range-progress`. Pure CSS + one computed gradient — no JS
    on input beyond the existing `onChange`.
- **i18n**: French `photo.calibration` "Calibration" → **"Calibrage"** (correct French; EN
  unchanged).

## Non-goals

- No change to slider behaviour, props, range, or any value logic — purely visual + one string.

## Acceptance criteria

- [ ] All sliders render the fader style (filled track, vertical thumb, softer gray) across the app.
- [ ] FR shows "Calibrage"; EN still "Calibration"; i18n key parity test stays green.
- [ ] `typecheck` / `lint` / `build` clean; full `vitest run` green (no hang).

## Decision log

3 interactive designs were prototyped in an HTML mockup (Net / Bulle / Fader); the user chose
**Fader** and asked for a lighter track gray and a slightly wider thumb (8→10 px).
