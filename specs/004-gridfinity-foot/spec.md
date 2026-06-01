# Spec 004 — Real Gridfinity foot + stacking lip

## Overview

Replace the it 2 approximate foot with a **real Gridfinity foot + stacking lip**, adapted
from the official replicad Gridfinity example (MIT). Parametrised by **pitch over a range**
(not just 42/36) so the user can make bins for specific bases. **No magnets/screws** (by
request — just the feet). The lip is **parametric, default on**.

## Goals

- Proper Gridfinity socket (foot) so bins seat in baseplates of the same pitch.
- Stacking lip, toggleable (`includeLip`, default true).
- Pitch is a continuous parameter, validated to **20–84 mm**.
- No magnet/screw holes.

## Non-goals

- Magnets/screws.
- Exact-spec fit tuning to a physical baseplate (the replicad profile uses big-taper 2.4 →
  socket height 5.0; standard spec is 2.15 → 4.75). Flagged for a fit-test pass (see questions).
- Pocket/UI/vision (later iterations).

## Requirements

- **R1** — `makeBin({ cols, rows, heightUnits, pitchMm?, includeLip? })` builds tiled feet + body + lip.
- **R2** — Foot/lip profiles are pitch-independent; only footprint + grid spacing scale with pitch.
- **R3** — `pitchMm` validated to `PITCH_MIN_MM..PITCH_MAX_MM` (20–84); out-of-range throws.
- **R4** — `includeLip` default true; toggling it changes the geometry.
- **R5** — `binDimensions` returns outer width/depth/height (`n·pitch−0.5`, `5 + units·7 + ~3.63`).

## Acceptance criteria

- [x] `src/cad/bin.ts` rewritten: socket (sweepSketch) + lip + tiled feet, no magnets, pitch range
- [x] Pitch validation (20–84) with throw
- [x] Tests: bbox for pitch 42/36/30, range validation, lip on/off changes STL, non-empty STL
- [x] `tools/cad/sample.ts` (tsx) generates samples from the real model — no duplication
- [x] `npm run typecheck | lint | test | build` green; CI green on PR #4 (merged)
- [ ] Physical fit on a real baseplate — deferred (see morning questions)

## Edge cases

- `pitchMm` ≤ 0 or outside 20–84 → throw.
- Lip on vs off → same outer bbox (top rise constant), different mesh.
- Attribution: foot/lip adapted from replicad's MIT example; GPL-compatible, credited in `bin.ts`.
