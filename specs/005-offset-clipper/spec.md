# Spec 005 — Polygon offset (clipper)

## Overview

Iteration 5. The **printing-clearance offset**: grow (or shrink) the tool's 2-D contour by a
delta in mm, with rounded joins — the same step the oracle did with pyclipper. Pure logic in
`core/`, fully unit-tested, runs in node and the browser.

## Goals

- `offsetPolygon(points, deltaMm)` → offset closed polygon (rounded joins).
- Positive delta = outward (clearance), negative = inward; collapse → empty.

## Non-goals

- Holes / multi-contour handling (single outer ring for now).
- UI wiring (it 4/8).

## Requirements

- **R1** — Uses `clipper-lib` (JS port of Clipper, like pyclipper), `jtRound` / `etClosedPolygon`.
- **R2** — mm coordinates scaled to integers (×1000) for Clipper, unscaled on return.
- **R3** — `< 3` points or non-finite delta → throw.
- **R4** — An inset that collapses the polygon returns `[]`.

## Acceptance criteria

- [x] `src/core/offset.ts` — `offsetPolygon` + `Point2D`
- [x] `src/types/clipper-lib.d.ts` — minimal ambient types (lib ships none)
- [x] Tests: outward +1 (bbox grows 1/side), inward −1, collapse → [], guards (4 tests)
- [x] `npm run typecheck | lint | test | build` green; CI green on the PR

## Edge cases

- Rounded corners add points but the bbox grows by exactly `delta` per side (verified).
- Inset ≥ half-width collapses → `[]` (caller decides what to do).
