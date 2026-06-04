# Spec 038 — controls panel reorganization (outline tab)

## Overview

The Détourage section had become overloaded (method + 4 sliders + toggle + lasso + contour editor),
and the outline tab carried **six** flat sections — confusing right when the magnetic lasso (037)
makes a clear workflow matter. Reorganize the left panel into the **two sections the user thinks
in** — *Image* and *Détourage* — chosen interactively from 3 proposals (a design panel; the user
picked **Proposition B**: journey-ordered, unified refine, advanced tuning folded).

## Goals

- Two top-level sections matching the user's mental model: **Image** (frame + adjust the photo) and
  **Détourage** (a method → refine by hand).
- A calm default: only what most users touch is visible; advanced tuning is collapsed.
- Make the key principle obvious: the **refine** tools (Modifier le contour, Lasso, Pinceau) are one
  group reachable **after any method**, including Auto.

## Non-goals

- No behavior/param changes — pure reorganization (same controls, handlers, state).
- No change to the détourage algorithms or the lasso/editor themselves.

## Requirements

- **Section "Image"**: subsections **Cadrage** (pivoter, rogner, angle + règle, réinitialiser) and
  **Réglages** (aplatir le fond, luminosité, contraste).
- **Section "Détourage"**: subsections **Calibrage** (Ø token — the scale lives with the détourage,
  not the photo), **Sélection** — *how* you grab the object (Photoshop-like): **Automatique** (the
  "magic" detection — Auto / Standard / Contours) **or Manuel** (the **Lasso**) — and **Retouche**
  (refine the current selection: Modifier le contour + the node editor, Pinceau — add/erase + size +
  reset), then a **single**
  collapsed **Réglages avancés** disclosure holding the fine tuning (Seuil, Lissage, Redresser les
  bords + Tolérance, Jeu) **and** the display aids (Masque vert + Opacité, Grille) under an inner
  "Affichage" label.
- **Visual hierarchy**: the `Section` header is **accent-blue**; subsections (`SubSection`) carry a
  slate heading with their controls **indented behind a hairline** — so the tree reads at a glance.
- A reusable **`ui/Disclosure`** (nested collapsible, closed by default) + a `SubSection` wrapper
  (heading + indented content). The existing `Section` (collapsible, now blue) wraps the two
  top-level sections.
- i18n: new `params.adjustments` (Réglages), `params.refine` (Retouche), `params.advanced`
  (Réglages avancés). The old standalone "Calibrage" / "Image" / "Affichage" / "Pinceau" sections
  are absorbed; `App.test` updated (asserts "Méthode" instead of the removed "Calibrage").

## Acceptance criteria

- [ ] Outline tab shows **2 sections** (Image, Détourage) with the subsections + the 2 collapsed
      disclosures; default view is calm (advanced/display folded) — verified by headless screenshots.
- [ ] Every previous control is still reachable; no param/behavior change.
- [ ] `typecheck` / `lint` / `build` clean; full `vitest run` green (no hang). CHANGELOG entry.

## Scope

**In:** `ui/Disclosure`, `ControlsPanel` outline-tab restructure, 3 i18n keys, `App.test` fixup,
the proposals doc (`docs/design/detourage-ux-proposals.html`), this spec + index row. **Out:**
behavior changes, the preview-tab panel. Bundled with the lasso (037) on the same branch because a
clear panel is what makes the lasso usable.
