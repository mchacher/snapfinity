# Spec 003 — CAD spike: parametric Gridfinity bin

## Overview

Iteration 2 — the spike that **de-risks the WASM CAD**. Prove replicad can build a
parametric Gridfinity bin and export STL, with automated geometry tests. A feasibility
probe settled an architecture fork: **model the foot directly in replicad** and drop the
planned Python/cqgridfinity bake. This iteration targets **correct outer dimensions**;
exact Gridfinity profile compliance is a later refinement.

## Goals

- replicad initialises **headless in Vitest (Node)** → automated bbox/volume tests possible.
- `makeBin({ cols, rows, heightUnits, pitchMm })` → a bin solid: rounded body + foot chamfer + hollow pocket.
- Export a valid STL.
- Support pitch **42** and **36 mm**.

## Non-goals

- No exact Gridfinity profile (precise chamfer stack, magnet/screw holes) — refinement iteration.
- No Python bake, no STEP assets.
- No tool pocket from a real footprint (it 3); no UI (it 4).

## Requirements

- **R1** — OpenCascade initialises in Node via a CJS shim (`initOpenCascadeForNode`); the browser build is unaffected.
- **R2** — `makeBin` returns a replicad `Shape3D` for given `cols/rows/heightUnits/pitchMm`.
- **R3** — `binDimensions` returns outer `width/depth/height`: `n·pitch − gap` and `base + units·7`.
- **R4** — STL export produces a non-empty blob.
- **R5** — pitch 42 and 36 both supported.

## Acceptance criteria

- [x] `src/cad/bin.ts` — `makeBin`, `binDimensions`, constants
- [x] `src/cad/oc-node.ts` — headless OC init (idempotent)
- [x] Geometry tests: 1×1, 2×1, 3×2 outer bbox + STL non-empty (6 tests)
- [x] `tools/cad/preview.mjs` generates a sample STL (`out/snapfinity-2x1.stl`)
- [x] Architecture updated (model-in-replicad; Python bake dropped)
- [x] `npm run typecheck | lint | test | build` green; CI green on PR #3 (merged)

## Scope

**In**: parametric bin in replicad, headless OC init + geometry tests, sample generator, architecture update.
**Out**: exact Gridfinity profile, pocket-from-footprint, UI, Python tooling.

## Edge cases

- OC init must be **idempotent** (tests share one instance).
- The foot chamfer must not change the outer bbox (a 45° chamfer stays within the footprint, z unchanged).
