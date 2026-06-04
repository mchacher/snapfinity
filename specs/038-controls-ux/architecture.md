# Architecture 038 — controls panel reorganization

## Components

- **`ui/Section`** (existing, collapsible) — wraps the two top-level groups; its header is now
  **accent-blue** (the visual anchor of the panel).
- **`SubSection`** (local to `ControlsPanel`) — a slate subsection heading + its controls **indented
  behind a hairline** (`border-l` + `pl`), so groups read as a clear tree under the blue section.
- **`ui/Disclosure`** (new) — a nested collapsible, **closed by default**, for the one folded
  "advanced" group.

## New tree (outline tab)

```
Section IMAGE  (blue)
  SubSection Cadrage   — pivoter ↺/↻ · rogner (crop) · angle (+ règle) · réinitialiser
  SubSection Réglages  — aplatir le fond · luminosité · contraste
Section DÉTOURAGE  (blue)
  SubSection Calibrage — Ø token (the scale belongs with the détourage, not the photo)
  SubSection Sélection — how to grab the object (Photoshop-like):
                           · Automatique (🪄): Tabs Auto / Standard / Contours
                           · Manuel: Lasso (Tracer + hint)
  SubSection Retouche  — refine the current selection: Modifier le contour (+ editor panel) ·
                         "contour manuel"+Auto · Pinceau (add/erase · taille · reset)
  Disclosure Réglages avancés ▸  (collapsed) — Seuil · Lissage · Redresser (+ Tolérance) · Jeu
                                   · inner "Affichage": Masque vert (+ Opacité) · Grille
```

## Why this shape

Journey-ordered (Proposition B), refined per the user: **Image** = the photo (frame + adjust);
**Détourage** = scale (Calibrage) → an outline (Méthode) → **Refine** by hand — the refine group
sits after the method, so it's reachable whatever the method (the key point). The Ø token moved
into Détourage (it's calibration for the détourage→mm scale, not a photo edit). The rarely-touched
tuning sliders **and** the display toggles fold into a **single** "Réglages avancés" disclosure
(they were two separate ones — fragmented) → the resting panel is calm.

Pure reorganization: the same control JSX (handlers, params, conditional editor panel) is just
re-parented under `SubSection` / `Disclosure`; accent-blue section headers + subsection indentation
are the only styling changes. No `Params`, `Workspace`, or behavior change. `App.test` asserts
"Méthode" (the removed "Calibrage" section heading).
