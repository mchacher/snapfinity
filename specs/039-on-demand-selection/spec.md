# Spec 039 — on-demand selection (don't auto-segment on load)

## Overview

Rework the détourage flow to match a Photoshop-like mental model. **Loading a photo must NOT try to
select the object** — it should only **detect the token** (for scale). The user then works the
**Image** (framing, adjustments), and only then makes a **selection** in **Détourage**, explicitly,
with tools. Previously the heavy u2netp segmentation ran automatically on every photo load.

## Goals

- **Photo load = token detection only.** No object selection, no contour, no pocket. Faster load,
  calmer preview.
- The object segmentation (u2netp) runs **on demand** — when the user uses the **magic wand**.
- A clear **selection state**: none on load; created by the magic wand or the lasso; refined by hand
  (Manuel = node editor + brush); **cleared** with *Effacer la sélection*.

## Non-goals

- Brush-from-scratch (paint a selection on a blank photo) — for now the brush/nodes **refine** an
  existing selection; create with the magic wand or the lasso. (Follow-up.)
- Changing the segmentation algorithms themselves.

## Requirements

- **Vision**: `analyzePhoto(file, { …, segment })` — `segment: false` runs token detection only and
  returns `saliency: null`; `true` runs u2netp. `PhotoAnalysis.saliency` is now `Float32Array |
  null`. `deriveMask` falls back to the edge route when there's no saliency.
- **`usePhotoAnalysis`**: a `segmentEnabled` flag (off on load, reset on every new photo);
  `requestSegment()` / `clearSegment()`; a segment toggle re-runs immediately. `useDerivedMask`
  returns `null` while `saliency` is null (token-only) → no mask/contour/pocket.
- **Workspace**: `onMagicWand` (drops any hand contour + `requestSegment`), `onClearSelection`
  (`clearSegment` + reset brush + clear hand contour), `hasSelection = contour.length ≥ 3`.
- **ControlsPanel — Sélection: a sequential 3-step wizard** (`selectionStep: 'method' | 'adjust'`
  in Workspace; a fresh detect resets to `'method'`). The **subsection title IS the current step**
  (`Créer la sélection` / `Méthode de détection` / `Ajuster la sélection`) — no redundant inner
  header under a generic "Sélection":
  - **Étape 1 — Créer la sélection** (no selection): one primary **🪄 Détecter l'objet** (detects
    with Auto) + **Sélectionner à la main** (arms the lasso).
  - **Étape 2 — 🪄 Méthode de détection** (auto selection, step `'method'`): the full **detection**
    config — **Standard / Contours** (no "Auto"; the auto-pick resolves to one and the UI presents
    the **active** one via `DerivedMask.resolvedMode` → `activeMethod`; clicking forces that method)
    + the **Seuil** — an invitation to try, then **Continuer →** (`onMethodNext`). **The manual
    adjust tools are hidden here.** Also *Effacer*.
  - **Étape 3 — Ajuster la sélection** (step `'adjust'`): a list of **selectable tools** — same row
    UI as Cadrage's Pivoter/Rogner (`AdjustTool` = label + toggle icon button); the **active tool's
    config appears just below it**. Tools: **Points** (node editor, `frameTool='contour'`),
    **Pinceau** (`'brush'`), **Lissage** (smoothing slider, `'lissage'`), **Redresser** (straighten
    toggle + tolerance, `'redresser'`) — the last three for an auto selection (`hasAutoMask`). Then
    **Effacer la sélection**. `'lissage'`/`'redresser'` are no-photo tools (map to `tool='none'`);
    the brush only paints when `frameTool==='brush'`. Lissage + Redresser **moved out of "Réglages
    avancés"**. No back-to-method link (removed — useless). Each tool is a **row** (name left, a
    small wide icon toggle right — same footprint as the Angle ruler; the Cadrage **Rogner** matches).
    **Pinceau** and **Points** keep their options in a **toolbar over the photo** (OutlinePanel,
    top-centre — fed `set` + the reset handlers): Pinceau = mode + size + reset; Points = the editing
    hint + Réinitialiser. **Lissage** and **Redresser** have simple options → **inline left-panel
    controls** (sliders), like the Réglages / Angle rows. **Redresser is a single slider** — `0 =
    don't straighten` (default), higher = stronger (`refineContour` gets `straighten:
    straightenToleranceDeg > 0`; `rectifyStraightEdges` already no-ops at ≤ 0). The old
    `straightenEdges` toggle is gone.
- **Lissage actually works.** `smoothContour`/`refineContour` scaled the simplify tolerance to a
  fixed `f·6` px — invisible on a full-res outline. Now it's **~2.5 % of the contour's own size**
  (`smoothingTolerancePx`) + Chaikin `round(f·4)`, so dragging the Lissage slider visibly rounds the
  contour at any resolution. (Tests compare the two functions to each other, so they still pass.)
  - A **manual (lasso) selection is rasterized into a mask** (`maskFromRing`, pure canvas) and feeds
    the **same pipeline** as an automatic one — so **all** Ajuster tools apply (brush on the mask;
    points / lissage / redresser on the contour), and *Réinitialiser* re-seeds from that contour (no
    more erase). `baseMask = manualMask ?? derived`; **`hasMask`** (any mask) gates the tools while
    **`isAutoMask`** (auto only) gates the method step — so a lasso skips straight to **Ajuster**. The
    manual mask is cleared on a fresh detect / clear / framing change / new photo. The lasso itself
    isn't an Ajuster tool (it re-creates from scratch → *Créer*). Editable-contour handles are 25 %
    bigger (nodeR 3.5→4.4).
  - i18n FR/EN.
- **Seuil is smooth.** The auto-pick is **pinned** to its resolved method (Workspace effect:
  `'auto'` → `resolvedMode`) so dragging the threshold re-derives **one** method instead of
  rebuilding+comparing both every step; the `Seuil` slider is **`commitOnRelease`** (the thumb
  follows the finger, the recompute fires once on release) with the **centered waiting overlay**
  (the existing `BusyOverlay`) shown on the photo while that recompute runs — `useDerivedMask`
  returns `{ derived, deriving }` → `computing`, held a **400 ms minimum** so the cue is seen; and
  it's **hidden for Contours** (edges ignores the threshold). The
  editable-contour / lasso **handles are halved** (nodeR 7→3.5, lasso dot 5→2.5) — they read as fine
  points, not blobs.

- **Photo never distorts.** The photo wrapper is sized in JS to the **contain-fit** of the image in
  the available container (`min(availW/w, availH/h)`, measured via a `ResizeObserver` on the parent),
  so the canvas + absolute overlays share exactly that box and the aspect ratio holds on any screen
  (a bare `inline-flex` item was stretching the height on short screens — distortion).
- **Photo area = toolbar zone + canvas.** OutlinePanel is now a column: a real **toolbar card** on
  top (token/scale chips, the active tool's contextual bar e.g. the brush options, and *Changer de
  photo*) and the **canvas** below filling the rest. **Zoom + pan** controls sit bottom-right of the
  canvas (`ZoomIn`/`ZoomOut`/`Hand`/reset) — implemented as a CSS `transform: translate() scale()` on
  the photo wrapper, so the canvas + overlays move together and the getBoundingClientRect coordinate
  math keeps editing aligned at any zoom. State (zoom/pan/panMode) lives in PhotoOverlay; the hand
  tool turns left-drag into a pan; it all resets on a new photo/framing.

- **Panel tidy-up.** The "Réglages avancés" disclosure is gone — its settings moved where they
  belong: **Jeu** (clearance) + **Opacité** → **Ajuster la sélection**; **Grille d'alignement** →
  **Cadrage**. The green-mask **show/hide toggle is removed** — the **Opacité** slider (0…1, 0 =
  hidden) replaces it. The **↺/↻ 90°** buttons are the small right-aligned size of the other Cadrage
  buttons (Rogner/règle). EN label `flatten` → "De-shadow" / FR "Anti-ombres" (was wrapping).
  **Type scale rebalanced (kicker pattern kept):** control labels/values/buttons **14→13 px**
  (`text-sm`→`text-[13px]` in Slider/Toggle/NumberField/Tabs + ControlsPanel) so the content stops
  dominating the headings; fine print (hints/links/units) **12→11 px** so 12 px is reserved for the
  (accent) section title; subsection stays 11 px, section 12 px. **Réinitialiser le cadrage** moved
  to the bottom of Cadrage (a trailing action, no longer wedged between rows).

## Acceptance criteria

- [ ] On load: token detected, **no contour / no selection**; the panel shows *Détecter l'objet* +
      *Lasso* only (no *Effacer*, no *Manuel*) — verified headless.
- [ ] Clicking the magic wand runs the segmentation → a selection appears (*Effacer* + *Manuel*
      show); *Effacer* clears it back to none. Zero console errors.
- [ ] The pocket / 3D only build once a selection exists.
- [ ] `typecheck` / `lint` / `build` clean; full `vitest run` green (no hang).

## Scope

**In:** the `segment` split (`analyze`), `usePhotoAnalysis` deferral, `useDerivedMask` gate,
Workspace wiring, the Sélection restructure, i18n, this spec + index row. **Out:** brush-from-scratch,
algorithm changes. Bundled on `feat/magnetic-lasso` (it completes the selection story with 035/037).
