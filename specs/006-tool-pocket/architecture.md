# Architecture — 006 tool pocket

## Pipeline stage(s) touched

CAD: turns the offset footprint (it 5) into the bin's cavity. Consumes a polygon; produces
the final pocketed bin for preview/export (it 4).

## Modules

- `src/cad/bin.ts` — `makeBin` gains `hollow?: boolean` (default true). `false` → solid body.
  Foot/box/lip fuses use plain `.fuse()` (no `commonFace`) for tessellation robustness.
- `src/cad/pocket.ts` — `makeBinWithPocket(params, footprint, { depthMm?, floorMm? })`:
  - builds a solid bin (`hollow: false`),
  - traces the footprint polygon (`draw().lineTo()….close()`), sketches it on the top plane,
    extrudes it **down** by the depth, and `cut`s it from the bin.
  - depth defaults to `heightUnits·7 − floor` (floor default 1 mm).

## Files

- `src/cad/pocket.ts`, `src/cad/pocket.test.ts`
- `src/cad/bin.ts` (hollow option, plain fuse)

## Risks / notes

- Footprint assumed centred on the origin (bin is origin-centred); real placement comes with
  vision wiring (it 6/7/8).
- Plain `.fuse()` may yield heavier meshes than `commonFace` — fine; decimation is a separate
  concern (see overnight-log).
