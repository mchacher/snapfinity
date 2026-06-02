# Spec 012 — Browser vision (photo → token + mask, live overlay)

## Overview

Iteration 8 (part 1). Run the vision pipeline **in the browser** for the first time: the
user uploads a photo, and the app detects the **token** (scale) and segments the **object**
(u2netp), then draws both **as an overlay on the photo** — mask tint + token circle — exactly
like the `verify:seg` overlays, but live in the app. The detected size also **auto-derives
the bin's cols/rows** from the object. This is the foundation every interactive step (the
live contour sliders in 013) builds on.

Today the vision modules (`token.ts`, `segment.ts`) only run under Node via the `verify:*`
tsx scripts (opencv.js + onnxruntime-**node**). The Workspace is driven purely by the CAD
sliders; the photo drop zone is a stub. This spec wires the real pipeline into the browser.

## Goals

- Upload a photo (file picker + drag-drop) — the photo **never leaves the browser**.
- Initialise opencv.js + **onnxruntime-web** in the browser (lazy, off the first-paint path).
- Run **token detection** (scale mm/px) and **u2netp segmentation** on the uploaded photo.
- **Isolate the tool** with the shared cleanup (token-circle exclusion + morph-open +
  largest-connected-component) — the same code the Node `verify:seg` uses (extracted, DRY).
- **Overlay** on the photo: green mask tint + token circle + (light) object bbox.
- **Auto-size**: cols/rows derived from the object bbox × scale via `gridFootprint`, when
  `manualSize` is off. Surface scale + token status in the existing pills.

## Non-goals (later iterations)

- Contour extraction + **smoothing / clearance sliders** with live redraw → **013**.
- Feeding the offset contour into the 3D **pocket** + preview/export of the real bin → **014**.
- Wood/textured-background robustness, HD/CLAHE matting → flagged, not now (white is the
  supported scope — decisions #11).
- Ground-truth `dataset/truth/` IoU gating in CI.

## Requirements

- **R1 — Image source (browser).** Decode a `File`/`Blob` to: full-resolution `ImageData`
  (for detection + overlay) and a `SEG_SIZE×SEG_SIZE` RGBA buffer (for u2netp). DOM/canvas
  adapter, mirrors `cv-image-node.ts`.
- **R2 — Segmentation runtime (browser).** Lazy-load `onnxruntime-web`, create a session from
  `public/models/u2netp.onnx`, run inference → saliency `Float32Array`. WASM assets resolve
  correctly under Vite (configure `ort.env.wasm.wasmPaths` / asset copy).
- **R3 — Shared mask cleanup.** Extract the token-exclusion + morph-open + largest-component
  logic into a reusable `src/vision/` function used by **both** the browser pipeline and the
  refactored `tools/cv/segment-verify.ts` (no behavioural change; `verify:seg` stays green).
- **R4 — Analyze orchestrator.** `analyzePhoto(image)` → `{ scaleMmPerPx, token{found,
  centerPx, radiusPx}, mask, objectBBoxPx, footprint{cols,rows} }`. Composes `loadOpenCv`,
  `detectToken`, `rgbaToTensor`/`saliencyToMask`, the shared cleanup, `maskBBox`,
  `gridFootprint`.
- **R5 — Pure helpers (unit-tested).** `maskBBox(mask,w,h)` (tight bbox of set pixels) and
  `footprintFromBBox(bboxPx, scaleMmPerPx, pitchMm)` (px → mm → `gridFootprint`).
- **R6 — UI.** The main area is **two tabs**: **Outline** (the photo at a workable size with
  the overlay — mask tint + token circle + bbox — upload via click/drag-drop, token-OD field,
  scale/token pills) and **3D preview** (the existing viewer). Both stay mounted (CSS toggle)
  so the WebGL context and bin aren't rebuilt on tab switch. The left panel holds only the
  parameters. Auto-size cols/rows when `manualSize` is off. Loading/error states; clear
  message when no token / no object. (The Outline tab is also where 013's contour sliders +
  mask brush will live.)

## Acceptance criteria

- [x] `onnxruntime-web` added; opencv.js + ort init lazily in the browser (build splits a
      separate `analyze-*.js` chunk — not in the entry)
- [x] `src/vision/image-source.ts` (browser decode) + pure `maskBBox` / `footprintFromBBox`
      with unit tests (9 new, synthetic masks/bboxes)
- [x] Shared `cleanMask` extracted to `isolate.ts`; `segment-verify.ts` refactored to use it;
      `npm run verify:seg` unchanged; `verify:vision` still 36/36
- [x] `analyzePhoto` orchestrator wired into a `usePhotoAnalysis` hook
- [ ] Upload a **white-background** photo in the app → overlay shows mask tint + token circle;
      cols/rows auto-update; scale pill shows mm/px — **pending user visual validation**
      (no headless browser harness; asset serving verified via `preview` + curl)
- [x] `npm run typecheck | lint | test | build` green; onnx/opencv lazy-loaded (not in the
      entry chunk); ort WASM served flat at `/ort/` (verified `application/wasm`, 200)

## Edge cases

| Case | Behaviour |
| ---- | --------- |
| No token found | No calibration; warn in the pills; keep manual size (no auto-size); overlay still shows the mask |
| Empty / tiny mask | Don't auto-size to 0×0; warn "object not found"; keep last size |
| Object larger than the token frame | `ceil(dim/pitch)` as usual (no cap this iteration) |
| Huge photo | Detection runs on full res; segmentation on the 320 downscale (as today) |
| Wood background | Works but degraded (known) — not gated; white is the supported scope |

## Note — WASM under Vitest (unchanged)

opencv.js + onnxruntime still can't init under Vitest. The **pure** helpers (`maskBBox`,
`footprintFromBBox`, existing `segment`/`calibration`/`sizing`) are unit-tested; the cv/onnx
path is validated by the Node `verify:*` scripts (now sharing `cleanMask`) + a **manual
visual check** in the browser. The browser uses **onnxruntime-web**; Node verify keeps
`onnxruntime-node`.
