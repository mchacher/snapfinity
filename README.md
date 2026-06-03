<p align="center"><img src="docs/logo.svg" alt="Snapfinity" height="64" /></p>

# Snapfinity

Snap a photo of a tool → get a custom **Gridfinity** bin with a pocket shaped exactly
like it, ready to 3D-print. Runs **100 % in your browser** — your photo never leaves
your device.

**By Marc Chachereau** · [GPL-3.0](LICENSE)

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

## Development

```bash
npm install     # Node 20+
npm run dev     # Vite dev server
npm test        # vitest
npm run build   # production build → dist/
```

`src/core/` is pure, unit-tested logic; WASM (opencv.js, replicad, three.js, clipper) and
UI come in later iterations as thin adapters around it. CI runs typecheck + lint + test +
build on every push and PR.

## Deploy

Snapfinity is a static site — the build in `dist/` can be served from any static host. The
base path is configurable: `BASE_PATH=/sub/ npm run build` for a project subpath, or the
default `/` for a root domain. Runtime assets resolve via `import.meta.env.BASE_URL`, so a
subpath just works. No COOP/COEP headers are needed (inference is single-threaded).

**GitHub Pages** (manual deploy workflow included):

1. Repo **Settings → Pages → Source → "GitHub Actions"** (one-time).
2. **Actions → Deploy (GitHub Pages) → Run workflow.** It builds with `BASE_PATH=/snapfinity/`
   and publishes. Result: `https://<user>.github.io/snapfinity/`.

**Cloudflare Pages** (root domain):

- Connect the repo; build command `npm run build`, output directory `dist`, env `BASE_PATH=/`.

The deploy workflow is **manual-trigger only** for now; flip it to run on push once the host
is settled. For the host trade-offs (bandwidth, the Cloudflare 25 MiB per-file gotcha, deploy-size
hygiene), see [docs/technical/hosting.md](docs/technical/hosting.md).

## Status & roadmap

Foundation + scaffold in place; product features are built iteration by iteration — see
[docs/roadmap.md](docs/roadmap.md) and [docs/specs-index.md](docs/specs-index.md).
Development follows a specs-first, gate-driven workflow (see [CLAUDE.md](CLAUDE.md)).
