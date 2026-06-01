# Architecture — 005 polygon offset

## Pipeline stage(s) touched

The **offset** stage: sits between the extracted contour (it 6/7) and the CAD pocket (it 3).

## Module

`src/core/offset.ts` — pure, framework-free:

```ts
offsetPolygon(points: Point2D[], deltaMm: number): Point2D[]
```

- Scales mm → integers (×1000) for Clipper, runs `ClipperOffset` with `jtRound` /
  `etClosedPolygon`, rescales back. Mirrors the oracle's pyclipper usage.
- Library: **clipper-lib** (pure-JS Clipper port; works in node and browser). No bundled
  types → `src/types/clipper-lib.d.ts` declares the minimal offset API.

## Files

- `src/core/offset.ts`, `src/core/offset.test.ts`
- `src/types/clipper-lib.d.ts`
- dep: `clipper-lib`

## Risks

- Single outer ring only; tool footprints with holes are a later concern.
- Clipper integer scaling caps precision at ~µm — irrelevant at print scale.
