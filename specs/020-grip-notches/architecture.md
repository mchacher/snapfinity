# Architecture — 020 side grip notches

## Pipeline stage touched

**CAD** only, in the worker. After `makeBin` / `makeBinWithPocket`, a new
`cutGripNotches(bin, binParams, notch)` carves the rim; then mesh/export as before.

## Geometry

Bin body is centred on XY: `W = cols·pitch − CLEARANCE` (X), `D = rows·pitch − CLEARANCE` (Y);
top rim ≈ `rimZ = heightUnits·HEIGHT_UNIT_MM + TOP_RISE`.

For each finger notch, cut a **cylinder** (`makeCylinder(r, len, location, [0,1,0])`) whose axis
is perpendicular to the front wall (along +Y), centred at `(cx, −D/2, rimZ)`:

- axis along Y, `len = 2r + 4`, located at `[cx, −D/2 − len/2, rimZ]` → spans the outer face
  inward; carves a semicircular scoop of radius `r` down into the rim (top half is air).
- two notches at `cx = ±spacing/2`, `spacing = clamp(max(2r+6, 28), …, W − 2r − 4)`.

Guards: skip if `W < 2r + 4` (drop to 1, then 0 with a `log`); clamp `r ≤ rimZ − 2` so the
scoop stays above the feet. Outer bbox is preserved (scoops are within the envelope).

## Worker plumbing

`notch: { enabled: boolean; radiusMm: number }` is threaded build-side only:

```
useBin → buildBin(binParams, footprint, depthMm, notch)
       → cad-client request { type:'build', …, notch }
       → cad.worker: shape = make…(); shape = cutGripNotches(shape, binParams, notch)
```

`sig` in `useBin` includes `gripNotches`/`notchRadiusMm` so a change rebuilds.

## Files

| File | Change |
| ---- | ------ |
| `src/cad/notches.ts` | **new** — `cutGripNotches` + `NotchConfig` |
| `src/cad/notches.test.ts` | **new** — Node OC (bbox preserved, meshable) |
| `src/cad/cad-messages.ts` | `build` carries `notch` |
| `src/cad/cad.worker.ts` | apply `cutGripNotches` after build |
| `src/cad/cad-client.ts` | `buildBin(..., notch)` |
| `src/features/workspace/useBin.ts` | pass `notch`; add to `sig` |
| `src/features/workspace/Workspace.tsx` | `gripNotches`, `notchRadiusMm` in `Params` |
| `src/features/workspace/ControlsPanel.tsx` | toggle + radius slider (Preview tab, Général) |
| `src/i18n/*` | `params.grip`, `params.gripSize` |

## Risks

- Plane/axis orientation → avoided by `makeCylinder` with explicit `location` + `direction`
  (no named-plane normal ambiguity).
- Boolean robustness on the lip profile → verified by a headless render + the Node test.
