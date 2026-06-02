# Spec 016 — WebGPU inference + pocket polygon simplification (perf)

## Overview

Two low-risk performance wins, bundled as the first step of the larger perf pass
(WebGPU + pocket + workers). Compute today is slow because the two heaviest stages run
synchronously on the main thread:

- **u2netp inference** (~3 s on CPU WASM) — the segmentation pass.
- **the replicad boolean cut** (~1–3 s) — hollowing the bin with the tool pocket.

This spec attacks the *work*, not the *threading* (workers come in 017/018):

1. Run u2netp on **WebGPU** when the browser exposes it, falling back to CPU WASM
   everywhere else. WebGPU runs the conv-heavy net several× faster.
2. **Decimate the pocket footprint** (Douglas–Peucker) before the replicad cut. The
   contour reaches the CAD with hundreds of near-collinear points (clipper offset +
   Chaikin rounding); each becomes a `lineTo` edge the boolean must process. Dropping
   sub-print-resolution points shrinks the polygon to ~tens of edges with no visible
   change.

## Goals

- Faster first analysis (WebGPU) on Chromium/Edge and any WebGPU-capable browser.
- Faster 3D rebuild on complex shapes (fewer pocket edges) — proportional to point count.
- Zero behavioural change otherwise: same silhouette, same bin, same exports.

## Non-goals

- Web workers / off-main-thread compute → **specs 017 (CAD) and 018 (vision)**.
- GPU-resident output tensors (we keep the CPU readback — the mask post-proc is on CPU).
- Changing the model, the threshold, or any vision parameter.
- Multi-threaded WASM (would need COOP/COEP, which static hosts don't set — see arch §9).

## Requirements

### R1 — WebGPU execution provider (with WASM fallback)

- The u2netp session is created with execution providers `['webgpu', 'wasm']` when
  `navigator.gpu` exists, else `['wasm']`. onnxruntime tries them in order, so a missing
  or failing WebGPU adapter transparently drops to WASM.
- The WebGPU backend reuses the same JSEP WASM glue already copied to `/ort/`; no new
  assets, still fully offline.
- `numThreads = 1` is kept (the WASM fallback stays single-threaded — no COOP/COEP).
- The provider list is chosen by a **pure, cv/ort-free helper** so it is unit-testable.

### R2 — Pocket footprint simplification

- Before drawing the pocket sketch, the mm footprint is simplified with Douglas–Peucker
  at a tolerance **well below print resolution** (`POCKET_SIMPLIFY_MM = 0.2 mm`, vs a
  typical 0.4 mm nozzle) — the printed pocket is geometrically unchanged.
- The decimation is a **pure helper** (`core/footprint.ts`) so it is unit-testable
  without booting replicad.
- If simplification would leave < 3 points (degenerate input), the original ring is used.

## Acceptance criteria

- [ ] u2netp runs on WebGPU in a WebGPU-capable browser, producing the **same silhouette**
      as the WASM path (manual visual check on `ciseaux.jpg`). *(user to verify)*
- [ ] On a browser without WebGPU, analysis still works via the WASM fallback. *(user to verify)*
- [x] The pocket footprint is decimated before the cut; the resulting bin keeps the same
      outer dimensions and visibly the same pocket shape. *(unit-tested: dense-ring dims preserved)*
- [x] New unit tests: provider selection (R1) + footprint decimation (R2).
- [x] All existing tests pass (retro-compat); `build`, `lint`, `typecheck` clean. *(81 tests)*

## Scope

**In:** `seg-runtime.ts` (WebGPU import + provider selection), a pure provider helper,
a pure footprint-decimation helper, `pocket.ts` calling it, unit tests, vite is unchanged
(the JSEP WASM is already copied).

**Out:** workers, UI changes, new parameters, model changes.

## Edge cases

- **No WebGPU** (Safari/Firefox/older): provider list is `['wasm']` → unchanged behaviour.
- **WebGPU present but adapter fails** at session create: onnxruntime falls back to the
  next provider (`wasm`) automatically.
- **Already-simple footprint** (e.g. a 4-point square): decimation returns it ~unchanged;
  the cut must still succeed.
- **Degenerate ring** after simplify (< 3 pts): fall back to the original footprint.
