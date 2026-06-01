# Architecture — 004 Gridfinity foot + lip

## Pipeline stage(s) touched

CAD assembly (replaces the it 2 approximate foot).

## Model (adapted from replicad's MIT Gridfinity example)

```
makeBin({ cols, rows, heightUnits, pitchMm=42, includeLip=true }):
  socket  = sweepSketch(socketProfile) over rounded-rect(pitch-0.5)  → one foot (z 0..-5)
  feet    = cloneOnGrid(socket, pitch, cols, rows)                   → tiled & fused
  body    = rounded-rect(cols·pitch-0.5, rows·pitch-0.5).extrude(units·7).shell(1.2)
  top     = buildTopShape(includeLip) swept on the top plane         → stacking lip
  bin     = feet ∪ body ∪ top
```

- **socketProfile / topShape are pitch-independent** (stacking interface is constant);
  only the footprint rectangles and `cloneOnGrid` spacing use `pitch`.
- Constants from the spec/example: CLEARANCE 0.5, CORNER_RADIUS 4, SOCKET_HEIGHT 5
  (0.8 + 1.8 + 2.4), TOP_FILLET 0.6, WALL 1.2. `TOP_RISE 3.63` measured (pitch/lip-independent).
- Magnets/screws removed. Pitch validated to `PITCH_MIN_MM(20)..PITCH_MAX_MM(84)`.

## replicad TypeScript notes

`drawRoundedRectangle(...).sketchOnPlane()` is typed `SketchInterface | Sketches`; cast to
`Sketch` to reach `.sweepSketch`. Sweep profile callbacks are typed `(plane: Plane, origin: Point) => Sketch`.

## Files

- `src/cad/bin.ts` — rewritten (socket/lip/feet, pitch range, no magnets)
- `src/cad/bin.test.ts` — pitch 42/36/30 bbox, range validation, lip effect, STL
- `tools/cad/sample.ts` — tsx sample generator importing the real model (replaces the mjs)
- `package.json` — `sample` script, `tsx` dep

## Risks

- **Fit accuracy**: replicad's socket height is 5.0 (big taper 2.4) vs standard 4.75 (2.15).
  May affect seating in standard baseplates → physical fit test needed (morning question).
- STL size: detailed foot/lip → large meshes (~17 MB for 2×1). Decimate before web/print later.
