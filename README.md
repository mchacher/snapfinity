# Snapfinity

Snap a photo of a tool → get a custom **Gridfinity** bin with a pocket shaped exactly
like it, ready to 3D-print. Runs **100 % in your browser** — your photo never leaves
your device.

**By Marc Chachereau** · License: TBD

> 🚧 **Foundation stage.** Architecture and working method are set; the app is not built
> yet. See [docs/technical/architecture.md](docs/technical/architecture.md).

## How it works

```
📱 photo (tool + calibration token)
  → detect token, calibrate scale (mm/px)
  → extract the tool's outline + clearance offset
  → hollow a parametric Gridfinity base to that shape
  → preview in 3D, export STL / STEP / 3MF
```

## Concepts

- **Token** — a printed disc of known size in the photo; gives the scale.
- **Footprint** — the tool's outline, the shape of the bin's pocket.
- **Pitch** — Gridfinity grid spacing: **42 mm** (standard) or **36 mm**.
- **Bin** — the generated box: Gridfinity base hollowed to the tool's footprint.

## Tech stack

All client-side: Vite · opencv.js · clipper · replicad (OpenCascade WASM) · three.js.
Gridfinity base primitives are baked offline in Python (cqgridfinity). Hosted as a
static site.

## Status & roadmap

See [docs/specs-index.md](docs/specs-index.md). Development follows a specs-first,
gate-driven workflow (see [CLAUDE.md](CLAUDE.md)).
