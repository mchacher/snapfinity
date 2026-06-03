# Spec 034 — alignment grid on the 2D view

## Overview

When shooting / framing a photo, it helps to see whether the object and the calibration token are
laid out straight and square. Add an **optional alignment grid** overlaid on the 2D photo view
(the Détourage / outline tab), with a **toggle** to turn it on/off.

## Goals

- A clean, even grid over the photo to eyeball horizontals/verticals and alignment.
- A toggle (off by default) in the **Affichage** controls, next to the green-mask toggle.
- Scales with the displayed image (any zoom / aspect); never interferes with detection or export.

## Non-goals

- A mm-accurate / token-scaled ruler (the grid is geometric, not metric) — could come later.
- Snapping, guides, or any change to the contour / pocket / 3D / PDF. Display-only.

## Requirements

- New display param **`showGrid: boolean`** (default `false`) on `Params` — history-tracked like
  `showMask` (spec 025), so it round-trips with undo/redo and the other display toggles.
- **Toggle** in the `Affichage` section of `ControlsPanel` (`Toggle`, label `params.grid`).
- **Grid overlay** in `PhotoOverlay`: an absolutely-positioned `<svg>` covering the canvas rect
  (like the straighten/crop overlays), `pointer-events-none`, drawn **above** the photo/mask but
  **below** the interactive crop/straighten layers. Square-ish cells (~10 across the short side),
  thin accent-blue lines at low opacity, `vector-effect:non-scaling-stroke` so lines stay ~1 px at
  any display size. Rendered only when `showGrid` and the image has a size.
- i18n `params.grid` — FR "Grille d'alignement" / EN "Alignment grid".

## Acceptance criteria

- [ ] Toggle in **Affichage** turns a grid overlay on/off on the photo; **off by default**.
- [ ] The grid lines align to the displayed image and scale with it (verified by a headless
      screenshot with a real photo).
- [ ] No effect on token detection, contour, pocket, 3D, or export.
- [ ] `showGrid` survives undo/redo with the other params.
- [ ] CHANGELOG `[Unreleased]` entry; `typecheck` / `lint` / `build` clean; full `vitest run`
      green (no hang).

## Scope

**In:** `Params.showGrid` (+ default), `ControlsPanel` toggle, `OutlinePanel` prop pass,
`PhotoOverlay` SVG grid, `params.grid` i18n, CHANGELOG, this spec + index row. **Out:** metric
ruler, snapping, any geometry/export change.
