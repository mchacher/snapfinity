# Spec 006 — Tool-shaped pocket

## Overview

Iteration 3. Cut a cavity **shaped like the tool's footprint** into a Gridfinity bin, so the
tool nests snugly — instead of a generic rectangular cavity. Input is a closed polygon in mm
(synthetic for now; the real one comes from vision + offset in it 6/7 + it 5).

## Goals

- `makeBin` gains `hollow` (default true). `hollow: false` = solid body to cut into.
- `makeBinWithPocket(params, footprint, options)` cuts the footprint pocket from the top.
- Pocket depth defaults to the full body depth minus a floor; overridable.

## Non-goals

- Getting the footprint from a photo (it 6/7) or offsetting it (it 5 — already done).
- UI/export (it 4).

## Requirements

- **R1** — `makeBinWithPocket(params, footprint, { depthMm?, floorMm? })` returns the pocketed solid.
- **R2** — Outer bin dimensions are unchanged (the pocket is interior).
- **R3** — `< 3` footprint points or depth ≤ 0 → throw.

## Acceptance criteria

- [x] `makeBin` `hollow` option; `src/cad/pocket.ts` — `makeBinWithPocket`
- [x] Tests: outer bbox preserved, **STL export non-empty**, guards
- [x] `npm run typecheck | lint | test | build` green; CI green on the PR

## Resolved during the iteration

The solid-bodied pocketed bin first failed OpenCascade tessellation (`blobSTL` threw). Root
cause: the `{ optimisation: 'commonFace' }` flag on the foot/box/lip fuses left coincident
faces that broke meshing on a solid body. **Fix: drop `commonFace`** (plain `.fuse()`) in
`makeBin` — the hollow bin still meshes and the solid/pocketed bin now exports a valid STL.

## Edge cases

- Footprint assumed centred on origin (the bin is origin-centred); placement comes with vision wiring.
