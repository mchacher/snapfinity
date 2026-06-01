# Architecture — 003 CAD spike

## Pipeline stage(s) touched

The **CAD assembly** stage. Builds the Gridfinity bin solid that the tool pocket (it 3)
will later be subtracted from, and that the preview/export (it 4) will consume.

## Decision: model in replicad, drop the Python bake

The feasibility probe proved replicad runs headless and exports correct geometry, so the
foot is **modelled parametrically in replicad** rather than pre-baked in Python
(cqgridfinity). This removes a Python dependency and STEP assets, keeping everything in JS
for the all-browser target. Root [architecture.md](../../docs/technical/architecture.md)
§5 is updated accordingly.

## The replicad init quirk (node only)

`replicad-opencascadejs/src/replicad_single.js` mixes CJS (`__dirname`) with an ESM
`export default`, so Node loads it as ESM and `__dirname` is undefined. `oc-node.ts`
rewrites the trailing export to CommonJS, writes it to a temp `.cjs`, and `require`s it
with `locateFile` pointing at the wasm. **Browser builds are unaffected** (the browser
loads the wasm normally; that path is wired in it 4).

## Bin model

```
makeBin({ cols, rows, heightUnits, pitchMm = 42 }):
  width  = cols * pitch - GAP(0.5)
  depth  = rows * pitch - GAP(0.5)
  height = BASE_HEIGHT(4.75) + heightUnits * 7

  rounded-rectangle(width, depth, r=3.75) → extrude(height)   = body
  body.chamfer(BASE_HEIGHT*0.6, bottom edges)                 = foot
  rounded-rectangle(width-2·wall, depth-2·wall) @ z=floor → extrude  = cavity
  body.cut(cavity)                                            = bin
```

Constants (GAP, corner radius, base height, wall, floor) are **approximate** for this
spike — exact Gridfinity profile compliance is a later refinement.

## Files

- `src/cad/bin.ts` — `makeBin`, `binDimensions`, bin constants
- `src/cad/oc-node.ts` — headless OpenCascade init for Node/Vitest
- `src/cad/bin.test.ts` — geometry tests (bbox per size, STL non-empty)
- `tools/cad/preview.mjs` — sample STL generator (mirrors bin.ts; retired once the UI generates bins)
- `tsconfig.json` — `types: ["node"]`; deps: `replicad`, `replicad-opencascadejs`, `@types/node`

## Risks

- Sample generator duplicates the bin model (plain JS, no TS loader). Documented debt;
  the canonical model is `bin.ts` (tested). Retire with the it 4 UI.
- Approximate foot profile → bins are dimensionally correct but not yet guaranteed to
  click into real baseplates until the profile-refinement iteration.
