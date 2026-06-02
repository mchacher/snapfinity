# Plan — 007 CAD refinements

## Steps (done)

1. `bin.ts`: `SOCKET_BIG_TAPER 2.15`, `SOCKET_HEIGHT 4.75`, `TOP_RISE 3.38`.
2. Update the `binDimensions` hardcoded-height test (29.63 → 29.13); bbox tests still derive from `binDimensions`.
3. `src/cad/export.ts` — `shapeToStl` (tolerance + binary); `export.test.ts`.
4. `sample.ts` uses `shapeToStl`; regenerate samples (sizes verified).

## Task breakdown

- [x] foot spec constants + dimension update
- [x] `shapeToStl` export helper + test (coarser → smaller, non-empty)
- [x] sample.ts uses the helper; sizes verified (2×1: 17.5 MB → 0.84 MB)
- [x] four checks green (35 tests)
- [ ] PR + CI green

## Test plan

| Scenario | Expected |
| -------- | -------- |
| `binDimensions(2×1 h3).height` | ≈ 29.13 (4.75 + 21 + 3.38) |
| `makeBin` bbox (42/36/30) | matches `binDimensions` |
| `shapeToStl` coarse vs fine tolerance | coarse bytes < fine bytes |
| `shapeToStl` default | non-empty |

**Manual:** OpenSCAD render confirms a standard Gridfinity foot + lip. Physical fit = user print-test.
