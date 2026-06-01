# Plan — 006 tool pocket

## Steps (done)

1. `makeBin` `hollow` option (solid body when false).
2. `src/cad/pocket.ts` — `makeBinWithPocket` (trace footprint → extrude down → cut).
3. Tests; hit + fixed an OC meshing failure (dropped `commonFace`).

## Task breakdown

- [x] `hollow` option on `makeBin`
- [x] `makeBinWithPocket` (depth/floor options)
- [x] tests: bbox preserved, STL non-empty, guards
- [x] meshing fix (plain fuse)
- [x] four checks green locally
- [ ] PR + CI green

## Test plan

| Scenario | Expected |
| -------- | -------- |
| `makeBinWithPocket(2×1 h3, square 30)` bbox | == `binDimensions` (pocket interior) |
| pocketed bin `blobSTL()` | non-empty (meshes) |
| footprint < 3 pts / depth ≤ 0 | throws |

**Manual/visual** (morning): render a pocketed bin to confirm the cavity matches the footprint.
