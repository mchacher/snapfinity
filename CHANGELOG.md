# Changelog

All notable changes to Snapfinity are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Every pull request adds an entry under `[Unreleased]`** — this is enforced in CI
(`.github/workflows/changelog.yml`; trivial PRs may carry the `skip-changelog` label).
Cutting a release moves the `[Unreleased]` entries under a new dated version heading.

## [Unreleased]

### Added

- **Editable détourage** — hand-tune the detected contour: *Modifier le contour* opens a focused
  editor (the photo dims) where the outline shows as draggable node handles. **Drag** a node to
  move it, **click an edge** to add one, **double-click** a node to remove it; *Réinitialiser*
  returns to the auto detection. The edited contour drives the pocket / 3D / PDF, and node edits
  undo/redo. First step of the editable-détourage roadmap (GrabCut + magnetic lasso to follow).

## [1.0.1] - 2026-06-03

A small follow-up to the first release.

### Added

- An optional **alignment grid** over the 2D photo view (a framing aid to check the object and
  token are square), toggled from **Affichage → Grille d'alignement**. Off by default; display-only.
- The **app version** is now shown in the UI (landing footer + workspace header), sourced from
  `package.json` at build time.

### Changed

- The landing page now shows on **every** visit (it's the product's front door); the workspace
  logo is a clickable **"home"** that returns to it. Previously the landing was remembered in
  `localStorage` and skipped on return, so reopening the link went straight to the workspace.

## [1.0.0] - 2026-06-03

First public release. Snapfinity turns a phone photo of an object — placed next to a printed
calibration token — into a custom, 3D-printable **Gridfinity** bin with a pocket shaped exactly
like the object. It runs **100 % in the browser**: the photo never leaves the device.

### Added

- **Vision** — token detection + scale calibration (opencv.js), object segmentation
  (u2netp ONNX, WebGPU with a WASM fallback), outer-contour extraction with live
  smoothing / clearance / edge-straightening, and a manual add/erase **mask brush**.
- **Détourage methods** — Auto / Standard / Contours, including **edge segmentation** for
  transparent or reflective objects that saliency misses.
- **CAD** — parametric Gridfinity bin (replicad / OpenCascade WASM): real foot + stacking lip,
  configurable pitch (36 / 42 mm), size, height, wall thickness, two-finger **grip notches**;
  the object-shaped **pocket** is cut in a web worker so the preview stays interactive.
- **3D preview** (three.js / React-Three-Fiber) — ground grid, orientation cube, fit-to-view,
  visible edges, and a translucency slider; **STL / STEP** export and a printable **1:1 top-view
  PDF** plan.
- **Photo framing** — straighten, crop, 90° rotate, with multi-step **undo/redo**.
- **App** — FR / EN interface, a first-run **landing page**, and a downloadable **calibration
  token** (STL + STEP).

See [`docs/specs-index.md`](docs/specs-index.md) for the full per-feature history (specs 001–032).

[Unreleased]: https://github.com/mchacher/snapfinity/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/mchacher/snapfinity/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mchacher/snapfinity/releases/tag/v1.0.0
