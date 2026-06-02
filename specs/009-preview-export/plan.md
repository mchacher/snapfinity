# Plan — 009 live preview + export

## Steps (done)

1. `oc-browser.ts` (wasm via `?url`); `mesh.ts` (shape → BufferGeometry).
2. `export.ts`: `shapeToStep`, `binFilename`, `downloadBlob`.
3. `useBin` hook (init → makeBin → geometry, debounced).
4. `Viewer` (R3F Canvas + OrbitControls + lights); wire `Workspace` + `Header` (STL/STEP).
5. Tests (`binFilename`, `shapeToStep`, `shapeToGeometry`); deps `three`, `@react-three/fiber`, `@react-three/drei`.

## Task breakdown

- [x] browser OC init + mesh→geometry
- [x] STEP export + filename + download helpers
- [x] `useBin` hook + `Viewer` (R3F)
- [x] Workspace/Header wiring (live preview + STL/STEP export)
- [x] tests (43 total)
- [x] headless WebGL screenshot confirms the live bin renders
- [ ] PR + CI green

## Test plan

| Scenario | Expected |
| -------- | -------- |
| `binFilename(2,1,'stl')` | `snapfinity-2x1.stl` |
| `shapeToStep(bin)` | non-empty STEP blob |
| `shapeToGeometry(bin)` | BufferGeometry: position/normal/index counts > 0 |

**Manual/visual:** the viewer renders the bin live and updates with the controls (headless
WebGL screenshot at 2×1 confirms feet + lip). Orbit/zoom + actual download = user check.
