# Architecture 027 — edge segmentation + auto selector

## Modules

- **`src/vision/edges.ts`** (new):
  - `edgeMask(imageData, ww, wh): Uint8Array` — opencv pipeline at the working resolution
    (matFromImageData → resize to ww×wh → gray → GaussianBlur → Canny(30,90) → dilate(3) →
    morphologyEx CLOSE(ellipse 25) → findContours → fill). Returns a 0/255 mask buffer (ww·wh).
    Mirrors the validated `tools/cv/edge-proto.ts`. Requires opencv ready (so it lives in the
    cv-importing layer, like `isolate`/`contour-cv`).
  - `chooseSegmentMode(u2netpFrac, edgeFrac): 'standard' | 'edges'` — **pure** (no cv), so it's
    unit-testable. The conservative rule (only switch when u2netp clearly failed AND the edge
    blob is object-sized) lives here with the threshold constants.

- **`src/vision/analyze.ts`** — `deriveMask(a, threshold, mode)` gains a `mode`:
  - builds the **u2netp** work mask from the saliency (as today);
  - for `edges`/`auto`, also builds the **edge** work mask from `a.imageData` via `edgeMask`;
  - cleans (`cleanMask`: token-out + largest blob) the candidate(s), measures `countNonZero`
    fractions, and selects: `standard`→u2netp, `edges`→edge, `auto`→`chooseSegmentMode(...)`;
  - runs `outerContour` + bbox on the chosen cleaned mask (unchanged downstream shape).

- **`src/features/workspace/usePhotoAnalysis.ts`** — `useDerivedMask(result, threshold, mode)`
  threads the mode (debounced like threshold). **Type-only imports from `analyze` stay type-only**
  (the spec-026 CI-hang lesson — never value-import the WASM-heavy `analyze` eagerly).

- **`src/features/workspace/Workspace.tsx` / `ControlsPanel.tsx`** — new param
  `segmentMode: 'auto'|'standard'|'edges'` (default `auto`); a `Tabs` selector at the top of the
  Détourage section (Auto / Standard / Contours). i18n labels.

## Why in `deriveMask` (not `analyzePhoto`)

`deriveMask` already owns mask→contour at the working resolution and has `a.imageData` available,
so the edge mask is computed in the same cheap, threshold-driven step (no u2netp re-inference).
Edges don't depend on the saliency threshold, so in pure `edges` mode the threshold slider is
inert — acceptable for v1; a later optimisation could memoise the edge mask per analysis.

## Auto thresholds (browser-measured)

**onnxruntime-web (browser) gives very different saliency from onnxruntime-node** — the node
oracle said the screwdriver's u2netp was 0.3 %, but the **browser** gives 6.3 % (it actually
finds the body, just **misses the thin metal tip**). So the thresholds are tuned on **browser**
`[auto]` instrumentation, and area alone is not enough — a missed tip is tiny in area but large in
**extent**. Hence the **bbox-area ratio** (edge bbox / u2netp bbox):

| object | u2netp | edge | bbox ratio | → |
|---|---|---|---|---|
| screwdriver (transparent, missed tip) | 0.063 | 0.061 | **1.48** | edges |
| pen-white (thin, u2netp ~nothing) | 0.001 | 0.029 | 24.9 | edges |
| scissors-white (opaque) | 0.118 | 0.151 | 1.01 | u2netp |
| scissors-wood (textured) | 0.117 | **0.750** | 3.29 | u2netp |
| fork / hole-punch (opaque) | 1.0 / 0.20 | 0.07 / 0.20 | 0.13 / 0.98 | u2netp |

→ `EDGE_MIN(0.01) ≤ edgeFrac ≤ EDGE_MAX(0.55)` **and** ( `u2netpFrac < 0.025` **or**
`bboxRatio ≥ 1.3` ) ⇒ edges. The `edgeFrac ≤ 0.55` guard drops the textured blow-up before the
bbox ratio can fire on it.

## Testing

- Unit (vitest): `chooseSegmentMode` against the measured fractions (pure — no opencv, no hang).
- Oracle (tsx, like `verify:seg`): an `edges`/`auto` overlay on the screwdriver + a couple opaque
  photos, eyeballed; the screwdriver photo is added to `dataset/raw`. `edgeMask` itself is opencv
  (can't init under vitest), so it's covered by the oracle, not a unit test.
