# Architecture 039 — on-demand selection (final)

> This iteration grew well past the initial "defer u2netp" idea into a full détourage rework:
> a selection state, a manual path that rasterizes to a mask, a 3-step wizard, and a reworked photo
> workspace (toolbar + zoom/pan + contain-fit). This doc reflects the **shipped** state.

## 1. The deferral seam (token on load, object on demand)

`analyzePhoto` was already split cheap (token detect, opencv, cached by framing) vs heavy (u2netp).
The heavy half is gated behind an option:

- `analyzePhoto(file, { …, segment = true })` — when `segment` is false it skips `runSaliency` and
  returns `saliency: null` (the token is still detected). `PhotoAnalysis.saliency: Float32Array | null`.
- `deriveMask` captures `a.saliency`; with none it falls back to `effMode = 'edges'` (no saliency
  needed); `buildU2netp` throws if ever reached without one. It also returns `resolvedMode`
  (`'standard'|'edges'`) — the method the auto-pick actually used — so the UI can present the active
  method instead of a meaningless "Auto".

`usePhotoAnalysis` holds `segmentEnabled` (false on load; reset per new photo). The slow effect passes
`segment: segmentEnabled`, runs **immediately** on a fresh photo or a segment toggle (magic wand /
clear), debounced only for adjustment tweaks, and exposes `requestSegment()` / `clearSegment()`.
`useDerivedMask` returns `{ derived, deriving }`; `derived` is `null` while `saliency == null`, and
`deriving` drives the brief recompute spinner (held a 400 ms minimum). The threshold re-derive is
**commit-on-release** and the auto-pick is **pinned** to its `resolvedMode` so dragging re-derives one
method, not both.

## 2. Selection state (auto **and** manual share one pipeline)

The key idea: a **manual (lasso) selection is rasterized into a mask** (`vision/raster.ts
maskFromRing`, pure canvas), so it feeds the exact same pipeline as an automatic one — every adjust
tool then applies.

```
manualMask ?? derived  ──▶ useMaskEdit (brush layer)  ──▶ editedMask
   editedMask.outline   ──▶ refineContour(smoothing, straighten)  ──▶ autoContour
   editedContour ?? autoContour  ──▶ contour  ──▶ offset(clearance)  ──▶ footprintMm  ──▶ pocket/3D
```

Workspace flags:
- `baseMask = manualMask ?? derived` — manual overrides the auto mask.
- `hasMask = !!editedMask` — a mask exists (auto **or** manual) → unlocks the Ajuster tools.
- `isAutoMask = !!derived && !manualMask` — auto only → gates the **method** step of the wizard.
- `hasSelection = contour.length ≥ 3` → the pocket/3D build only once there's a selection.

`editedContour` (node edits / re-traces) still overrides everywhere. `manualMask` is cleared on a
fresh detect / clear / framing change / new photo (so a stale traced mask never lingers).

## 3. The wizard (sequential, `selectionStep`)

`selectionStep: 'method' | 'adjust'` lives in Workspace; a fresh detect resets it to `'method'`.
ControlsPanel renders the step as the **subsection title** (no redundant inner header):

- **Étape 1 — Créer la sélection** (`!hasSelection`): 🪄 *Détecter l'objet* (auto) or *Sélectionner à
  la main* (arms the magnetic lasso).
- **Étape 2 — Méthode de détection** (`isAutoMask && step==='method'`): **Standard / Contours** only
  (active = `resolvedMode`), an invitation to try them, the **Seuil**, then **Continuer →**. The
  adjust tools are hidden here. *(A manual selection skips this step — `!isAutoMask`.)*
- **Étape 3 — Ajuster la sélection**: the tools, then **Effacer**.

## 4. Ajuster tools — left rows + options over the photo

Tools are Cadrage-style rows (`AdjustTool`: label left, small icon toggle right):
- **Points** (`frameTool='contour'`) and **Pinceau** (`frameTool='brush'`, new) are **photo tools** —
  their options show in a **toolbar over the photo** (OutlinePanel): Points = the editing hint +
  Réinitialiser; Pinceau = add/erase + size + reset. The toolbar is fed `set` + the reset handlers.
- **Lissage** and **Redresser** are simple settings → **inline sliders** in the panel. Redresser is a
  single slider (`straightenToleranceDeg`, **0 = off**); Lissage's tolerance scales to the contour's
  own size (`smoothingTolerancePx`) so it's visible at any resolution. **Jeu** (clearance) and mask
  **Opacité** (0…1, the old show/hide toggle is gone) live here too.

`frameTool` gained `'brush' | 'lissage' | 'redresser'`; the brush only paints when
`frameTool==='brush'` (the overlay `tool` prop gained `'none'`; `lissage`/`redresser` are no-ops for
the overlay). Lissage/Redresser were moved out of the (now removed) "Réglages avancés" disclosure.

## 5. Photo workspace (OutlinePanel + PhotoOverlay)

- **Toolbar zone above the photo**: token/scale chips, the active tool's contextual bar, and *Changer
  de photo* — a real card, not an overlay. The **canvas** fills the rest.
- **Contain-fit**: the photo wrapper is sized in JS to `min(availW/w, availH/h)` (measured via a
  `ResizeObserver` on the parent) so the canvas + absolute overlays share exactly that box and the
  aspect ratio holds on any screen (a bare `inline-flex` stretched the height on short screens).
- **Zoom + pan**: a CSS `transform: translate() scale()` on the wrapper — the canvas and all overlays
  move together, so the `getBoundingClientRect` coordinate math keeps editing aligned at any zoom.
  Bottom-right controls (`ZoomIn`/`ZoomOut`/`Hand`/reset); the hand tool turns left-drag into a pan;
  state resets on a new photo/framing.

The token circle still draws on load; the green mask / contour only appear once a selection exists.
The editable-contour / lasso node handles are small (nodeR ≈ 4.4 px on-screen).
