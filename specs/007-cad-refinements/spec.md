# Spec 007 — CAD refinements (spec foot + mesh tolerance)

## Overview

Two refinements from the 2026-06-02 decisions (see `docs/decisions.md`):
1. **Foot → exact Gridfinity spec (4.75 mm)** for standard-baseplate compatibility.
2. **Mesh tolerance on STL export** so files are light (web + print).

## Changes

- **Foot profile**: `SOCKET_BIG_TAPER 2.4 → 2.15`, `SOCKET_HEIGHT 5 → 4.75` (vertical part
  stays 1.8). `TOP_RISE` re-measured 3.63 → **3.38**. Bin height now `4.75 + units·7 + 3.38`.
- **Export helper** `src/cad/export.ts`: `shapeToStl(shape, { toleranceMm = 0.05, binary = true })`.
  `Shape3D.blobSTL` accepts a tolerance; binary STL is far smaller. `sample.ts` uses it.

## Result

A 2×1 bin STL went **17.5 MB → 0.84 MB (~21×)**; pitch-36 1×1 → 0.71 MB. Render confirms a
standard Gridfinity foot + lip (visually unchanged; now spec-dimensioned).

## Acceptance criteria

- [x] Foot constants = spec (4.75); dimensions/tests updated
- [x] `shapeToStl` with default 0.05 mm tolerance, binary STL; `sample.ts` uses it
- [x] Test: coarser tolerance → smaller mesh; default export non-empty
- [x] `npm run typecheck | lint | test | build` green (35 tests); CI green on the PR
- [ ] Physical fit on a real baseplate — user print-test (foot is now spec-exact)

## Notes

- 0.84 MB for a 2×1 is fine for web; can go coarser (0.1 mm) if needed — exposed later if wanted.
