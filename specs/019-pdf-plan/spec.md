# Spec 019 — printable 1:1 top-view PDF plan

## Overview

Backlog feature #2. Export a **PDF top-view plan** the user prints **at 1:1** to validate the
detected footprint before printing the bin: lay the real object on the printout and check it
matches the outline, and see the actual pocket (object + clearance) that will be machined.

## Goals

- A one-click **"Plan PDF"** export (Header, next to STL/STEP).
- The printout is **true 1:1** — a printed 50 mm reference ruler measures exactly 50 mm.
- Works for objects larger than one sheet via **multi-page A4 tiling**.

## Non-goals

- 3D / isometric views, dimensioning callouts, GD&T.
- Page sizes beyond A4 portrait (Letter etc. — later).
- Editing the contour from the PDF; it's an output only.

## Requirements

### R1 — Content (decided)

- Draw two overlaid contours at 1:1:
  - **object outline** — solid line (the detected, smoothed contour).
  - **pocket outline** — dashed line (the clearance offset = what gets cut). Falls back to the
    object outline when clearance = 0.
- A **scale-check ruler**: a 50 mm reference (ticked line) labelled "50 mm — imprimer à 100 %".
- A header line with the object bounding box (W × H mm), the pitch, and the **print-at-100 %**
  instruction (disable "fit to page").

### R2 — True scale & tiling

- 1 mm on paper = 1 mm real: points are placed at `mm × 72/25.4` pt.
- If the content + margins exceed one A4 printable area, **tile** across an N×M grid of A4
  pages, each page drawing its window of the contour, with **crop/overlap marks** and a
  `row,col` label + an assembly hint. Single page when it fits.

### R3 — Calibration gate

- 1:1 is only meaningful with the calibration scale, so **"Plan PDF" is disabled unless a
  token was found** (scale known) **and** a contour exists. Tooltip/disabled state explains it.

### R4 — Local only

- The PDF is generated in the browser (pdf-lib) and downloaded; the photo/contour never leave
  the device.

### R5 — Print-robust output

- Fonts are **embedded + subset** (a bundled Inter face via `@pdf-lib/fontkit`) and the PDF is
  saved with a **classic structure** (`useObjectStreams: false`). Non-embedded base-14 fonts
  and compressed object/xref streams make some printers reject the job at the spooler (observed
  with Acrobat → physical printer); embedding + classic structure fix it.

## Acceptance criteria

- [ ] "Plan PDF" exports a PDF; printed at 100 %, the 50 mm ruler measures 50 mm. *(user to verify)*
- [ ] The object outline (solid) + pocket outline (dashed) appear at correct relative size.
- [ ] An object larger than A4 tiles across multiple pages that assemble to a 1:1 plan.
- [ ] The button is disabled with no token/contour.
- [x] Unit tests for the layout math + PDF generation (page count, non-empty). `build`/`lint`/`typecheck` clean.

## Scope

**In:** `src/pdf/layout.ts` (pure tiling/scale math) + `src/pdf/plan.ts` (pdf-lib builder),
Header button + gating, Workspace wiring (px→mm contours + download), i18n, `pdf-lib` dep.

**Out:** non-A4 sizes, 3D views, dimension callouts.

## Edge cases

- **No token** (no scale) → button disabled (can't guarantee 1:1).
- **Clearance = 0** → pocket outline = object outline (draw once, or dashed over solid).
- **Very large object** → many tiles; cap at a sane max (e.g. 6×6) and log/notice if exceeded.
- **Degenerate contour** (<3 pts) → button disabled.
