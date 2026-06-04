# Architecture 039 — on-demand selection

## The deferral seam

`analyzePhoto` already split cheap (token detect, opencv, cached by framing) from heavy (u2netp).
We gate the heavy half behind an option:

- `analyzePhoto(file, { …, segment = true })` — when `segment` is false it skips `runSaliency` and
  returns `saliency: null` (token still detected). `PhotoAnalysis.saliency: Float32Array | null`.
- `deriveMask` captures `a.saliency`; if it's null it uses `effMode = 'edges'` (the edge route needs
  no saliency), and `buildU2netp` throws if ever reached without one. In practice it's only called
  once a saliency exists (gated below).

## The selection state

`usePhotoAnalysis` holds `segmentEnabled` (default false; reset to false by an effect on `[file]`,
so a new photo is token-only). The slow effect passes `segment: segmentEnabled` and runs
**immediately** on a fresh photo *or* a segment toggle (magic wand / clear), debounced only for
adjustment tweaks. It exposes `requestSegment()` / `clearSegment()`.

`useDerivedMask` returns `null` while `result.saliency == null` → no mask → no `editedMask` → empty
`autoContour` → empty `contour` → `footprintMm` null → no pocket / empty 3D. So "no selection" falls
out of the existing pipeline for free; nothing downstream needed gating.

`Workspace`: `hasSelection = contour.length ≥ 3`. `onMagicWand` clears any hand contour (so the auto
result shows) and calls `requestSegment` — if already segmented this reverts to auto instantly (no
re-infer). `onClearSelection` = `clearSegment` + brush `reset()` + `setEditedContour(null)`.

## UI (Sélection)

Photoshop-like: **create** then **refine**.
- *Effacer la sélection* — only when `hasSelection`.
- **Automatique** (🪄) — a **Détecter l'objet** button (`onMagicWand`), the Auto/Standard/Contours
  mode, and the **Seuil** slider (moved up from the Advanced disclosure — it's the wand's main knob).
- **Lasso** — Tracer (creates a hand selection; works with no saliency since it sets `editedContour`).
- **Manuel** — the node editor (*Modifier le contour*) + the brush, shown only when `hasSelection`
  (they refine an existing selection; create-from-scratch is a follow-up).

The token circle still draws on load (token detected); the green mask / contour only appear once a
selection is made.
