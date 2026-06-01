# Spec 002 — Calibration & sizing math

## Overview

Iteration 1 of the roadmap. The first real domain logic: **pure functions** (no WASM, no
DOM) for scale calibration and Gridfinity sizing. This is the most testable layer — it gets
rich unit tests and sets the standard for every later module in `core/`.

## Goals

- Convert pixels → millimetres from the calibration token's known diameter.
- Compute the Gridfinity **footprint** (cols × rows) a real-world size needs, at a given pitch.
- Compute the Gridfinity **height** in 7 mm units.
- Support pitch **42 mm** (standard) and **36 mm** (compact).

## Non-goals

- No token *detection* (that's it 6 — this assumes the token diameter in px is already measured).
- No offset/clearance (it 5), no CAD/base height (it 2), no UI.

## Requirements

- **R1** — `mmPerPx(tokenDiameterPx, tokenDiameterMm?)` returns the scale; `tokenDiameterMm`
  defaults to the token's nominal OD (76.2 mm) but is overridable (caliper-measured value).
- **R2** — `pxToMm(px, mmPerPx)` converts a pixel length to mm.
- **R3** — `unitsForLength(lengthMm, pitchMm)` = `ceil(lengthMm / pitchMm)`, clamped to a
  minimum of **1** (a bin is at least one cell).
- **R4** — `gridFootprint(widthMm, depthMm, pitchMm)` returns `{ cols, rows }`.
- **R5** — `heightUnits(heightMm)` = `ceil(heightMm / 7)`, minimum **1**.
- **R6** — Named constants: `TOKEN_DIAMETER_MM = 76.2`, `HEIGHT_UNIT_MM = 7`,
  `PITCH = { standard: 42, compact: 36 }`.
- **R7** — Invalid inputs (≤ 0 where a positive is required, non-finite) **throw** a clear error.

## Acceptance criteria

- [x] `src/core/calibration.ts` — `mmPerPx`, `pxToMm` + constant, fully unit-tested
- [x] `src/core/sizing.ts` — `unitsForLength`, `gridFootprint`, `heightUnits` + constants, fully unit-tested
- [x] Placeholder `core/sanity.ts` removed (superseded by real modules)
- [x] Boundary tests pass (e.g. 42.0 → 1 unit, 42.01 → 2 units; pitch 36; zero → 1; negative → throws)
- [x] `npm run typecheck | lint | test | build` green locally (17 tests); CI green on PR #2 (merged)

## Scope

**In**: pure calibration + sizing functions, constants, their unit tests.
**Out**: detection, offset, CAD, UI.

## Edge cases

- `tokenDiameterPx ≤ 0`, `mmPerPx ≤ 0`, `pitchMm ≤ 0`, NaN/Infinity → throw.
- `lengthMm = 0` or `heightMm = 0` → 1 (clamped), not 0.
- Exact multiples (42, 84, 7, 14) land on the lower unit count (no off-by-one).
- Negative lengths → throw (a footprint can't be negative).
