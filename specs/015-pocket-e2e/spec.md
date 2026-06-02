# Spec 015 — Pocket end-to-end (contour → 3D bin → export)

## Overview

Iteration 9 — close the loop. Everything to the left of the 3D is done (photo → token →
mask → brush → smoothed + clearance contour). This iteration feeds that **offset contour into
the bin's pocket** so the 3D preview and STL/STEP export are a **real bin with a cavity shaped
like the object**. The CAD pocket (`makeBinWithPocket`) already exists (spec 006) with a
synthetic polygon; here it's driven by the actual photo-derived contour.

## Goals

- Convert the offset contour (full-res px, image coords) → a **mm footprint centred on the
  origin** (y-flipped to CAD space), at the calibration scale.
- `useBin` builds **`makeBinWithPocket`** when a footprint + scale exist (depth = the tool
  thickness); otherwise the plain bin (no token / no object).
- The **3D rebuild is gated to the Preview tab** — replicad runs on the main thread, so we
  must not re-cut the pocket while the user is painting on the Outline tab.
- Export (STL/STEP) uses the pocketed shape (automatic — it's the same `shape`).

## Non-goals (later)

- Interior holes in the pocket (outer-only — decisions #13).
- 3MF export, base variants, magnets.
- Contour point-editing (→ later iteration).
- A 2D↔3D live sync while painting (the pocket updates when you open the Preview tab).

## Requirements

- **R1 — Pure `contourToFootprintMm(offsetPx, scaleMmPerPx)`** → centred (bbox-centre), scaled,
  y-flipped mm polygon. Pure, unit-tested.
- **R2 — `useBin`** takes the footprint (mm) + `thicknessMm` + an `enabled` flag. When enabled
  with a valid footprint → `makeBinWithPocket` (depth = `min(thicknessMm, body − floor)`); else
  `makeBin`. Rebuild gated on `enabled` (Preview tab) + debounced.
- **R3 — Workspace** computes contour/offset/footprint once (lifted from OutlinePanel), passes
  the footprint + `enabled = tab==='preview'` to `useBin`, and the px contour/offset down to the
  overlay.
- **R4 — Export** unchanged in wiring — exports whatever `useBin` produced (now pocketed).

## Acceptance criteria

- [x] `contourToFootprintMm` (pure) + unit tests (3: centring, scale, y-flip)
- [x] `useBin` builds the pocketed bin on the Preview tab when token+object exist; plain bin otherwise
- [x] No CAD rebuild while painting on the Outline tab (gated to Preview); signature guard skips no-op tab toggles
- [x] 3D preview shows the object-shaped cavity; STL/STEP export the same shape
- [x] `npm run typecheck | lint | test (74) | build` green
- [x] Verified via Playwright: scissors photo → Preview tab → bin shows the scissors-shaped pocket

## Edge cases

| Case | Behaviour |
| ---- | --------- |
| No token (no scale) | Plain bin (rectangular shell); a note that the pocket needs a token |
| No object / < 3-pt contour | Plain bin |
| `thicknessMm ≥ body height` | Clamp depth to `body − floor` (keep a floor) |
| Painting on Outline tab | No 3D rebuild (gated); pocket updates when Preview is opened |

## Note

`makeBinWithPocket` is reused as-is. The only new pure logic is the px→mm centred footprint;
the CAD/cut is validated by the existing CAD tests + a manual visual check of the 3D preview.
