# Architecture — 002 calibration & sizing math

## Pipeline stage(s) touched

The **calibration** and **sizing** steps, as pure logic. Inputs come from later stages
(token detection feeds `tokenDiameterPx`; the footprint bbox feeds the sizing functions),
but this iteration only provides the framework-free math.

## Modules & API

### `src/core/calibration.ts`

```ts
export const TOKEN_DIAMETER_MM = 76.2; // token 2.0 v4 nominal OD (radius 38.1)

// scale in mm per pixel, from the token's measured pixel diameter
export function mmPerPx(tokenDiameterPx: number, tokenDiameterMm?: number): number;

export function pxToMm(px: number, mmPerPx: number): number;
```

### `src/core/sizing.ts`

```ts
export const HEIGHT_UNIT_MM = 7;
export const PITCH = { standard: 42, compact: 36 } as const;

export interface GridFootprint {
  cols: number;
  rows: number;
}

export function unitsForLength(lengthMm: number, pitchMm: number): number; // ceil, min 1
export function gridFootprint(widthMm: number, depthMm: number, pitchMm: number): GridFootprint;
export function heightUnits(heightMm: number): number; // ceil(/7), min 1
```

## Data shapes

- Inputs/outputs are plain `number`s and a small `GridFootprint` record — no classes, no I/O.
- Pitch is passed as a number in mm (`PITCH.standard` / `PITCH.compact`), keeping the door
  open for other pitches later without an enum rewrite.

## Validation

A small internal guard (e.g. `assertPositive(name, value)`) throws `Error` on `≤ 0` or
non-finite inputs where a positive is required. Clamping to a minimum of 1 unit happens
*after* the `ceil`, so `0 mm → 1 unit` while `−x` throws.

## Files

- Add `src/core/calibration.ts`, `src/core/calibration.test.ts`
- Add `src/core/sizing.ts`, `src/core/sizing.test.ts`
- Remove `src/core/sanity.ts`, `src/core/sanity.test.ts` (placeholder superseded)

## Risks

Low. Main correctness traps are off-by-one at exact multiples and the 0-vs-negative
boundary — both pinned explicitly by the test plan.
