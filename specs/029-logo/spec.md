# Spec 029 — brand mark (logo + favicon)

## Overview

Replace the placeholder lucide `Boxes` icon with a real Snapfinity mark and add a favicon. The
mark — chosen interactively from ~12 explored concepts (variant **F1**) — is a **camera inside a
Gridfinity bin**: the camera = the photo "snap", the rounded square + faint edge ticks = the grid
bin. It captures exactly what the app does (photo of an object → grid bin with a pocket).

## Changes

- **`src/ui/Logo.tsx`** — the mark as an inline SVG (24 viewBox), stroke = `currentColor` so it
  inherits colour. Single source of truth for the glyph.
- **Header** — replace the accent-filled square + `Boxes` with the `Logo` in **accent on the white
  header** (`text-accent-600`), per the chosen "accent-on-white" treatment that blends into the site.
- **`public/favicon.svg`** — the mark on a **white rounded tile** (reads on light *and* dark tab
  bars) + `<link rel="icon" type="image/svg+xml">` in `index.html`.
- **`docs/logo.svg`** — a polished **horizontal lockup** for documentation: accent tile + white
  mark + "Snapfinity" wordmark + tagline. Embedded at the top of the README.

## Non-goals

- No PNG/ICO raster set (a single SVG favicon covers modern browsers); can add rasters later if an
  old-browser/social-card need appears.
- No behaviour change.

## Acceptance criteria

- [ ] Header shows the new mark (accent on white) next to "Snapfinity".
- [ ] Browser tab shows the favicon; legible at 16 px on light and dark tab bars.
- [ ] `docs/logo.svg` renders the lockup; README shows it.
- [ ] `typecheck` / `lint` / `build` clean; full `vitest run` green (131).

## Decision log

~12 concepts were explored in interactive HTML mockups (grid+pocket, camera-in-grid/bin, aperture,
∞ lenses, scan frame, monogram…). The user chose the **F1** family (camera in a grid bin), then the
**accent-on-white** treatment for the favicon/header, and a richer accent-tile lockup for the docs.
