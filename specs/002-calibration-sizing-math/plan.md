# Plan — 002 calibration & sizing math

## Implementation steps (ordered)

1. `src/core/sizing.ts` — constants + `unitsForLength`, `gridFootprint`, `heightUnits` + guard.
2. `src/core/calibration.ts` — constant + `mmPerPx`, `pxToMm`.
3. Tests: `sizing.test.ts`, `calibration.test.ts` (implement the full test plan below).
4. Remove `src/core/sanity.ts` + `sanity.test.ts`.
5. `npm run typecheck | lint | test | build` → all green.

## Task breakdown

- [x] `sizing.ts` (constants, 3 functions, input guard)
- [x] `calibration.ts` (constant, 2 functions)
- [x] `sizing.test.ts` covering every scenario below
- [x] `calibration.test.ts` covering every scenario below
- [x] remove sanity placeholder
- [x] four checks green locally
- [x] PR + CI green (#2, merged)

## Test plan

All pure logic → 100 % unit-tested. No oracle/manual needed.

| Module        | Scenario                                   | Expected                          |
| ------------- | ------------------------------------------ | --------------------------------- |
| calibration   | `mmPerPx(500)` with default OD 76.2        | ≈ 0.1524                          |
| calibration   | `mmPerPx(500, 80)` (caliper override)      | = 0.16                            |
| calibration   | `mmPerPx(0)` / negative / NaN              | throws                            |
| calibration   | `pxToMm(100, 0.1524)`                      | ≈ 15.24                           |
| calibration   | `pxToMm(x, 0)` / negative scale            | throws                            |
| sizing        | `unitsForLength(130, 42)`                  | 4                                 |
| sizing        | `unitsForLength(42, 42)` (exact boundary)  | 1 (no off-by-one)                 |
| sizing        | `unitsForLength(42.01, 42)`                | 2                                 |
| sizing        | `unitsForLength(50, 36)` (compact pitch)   | 2                                 |
| sizing        | `unitsForLength(0, 42)` (clamp)            | 1                                 |
| sizing        | `unitsForLength(-5, 42)` / `pitch ≤ 0`     | throws                            |
| sizing        | `gridFootprint(130, 80, 42)`               | `{ cols: 4, rows: 2 }`            |
| sizing        | `heightUnits(14)` (exact)                  | 2                                 |
| sizing        | `heightUnits(15)`                          | 3                                 |
| sizing        | `heightUnits(0)` (clamp) / `heightUnits(-1)` | 1 / throws                      |

**Meta-validation**: typecheck/lint/build green, CI green on the PR.
