# UI principles (agreed 2026-06-02)

The agreed design before building the UI (it 4). Locks the structure + design system so
screens stay consistent.

## Structure — single workspace

```
DESKTOP                                  MOBILE
+----------------------------------+     +------------------+
| <> Snapfinity        FR/EN  ☾    |     | <> Snapfinity    |
+--------------+-------------------+     |                  |
| PHOTO        |                   |     |      /\  3D       |
| [thumbnail]  |       /\          |     |    / bin\        |
|  ◯ token ✓   |     / bin\   3D    |     |     \  /         |
|  contour ✓   |      \  /  preview |     |  ______________  |
|              |       \/          |     | | Pas 42   v  |  | <- bottom sheet
| PARAMÈTRES   |                   |     | | Haut 3×7    |  |    (drag up)
| Pas/Taille   |                   |     | | [ ⬇ STL ]   |  |
| Haut/Épais   |                   |     +------------------+
| Jeu / Lèvre  |                   |
| [⬇ STL] STEP |                   |     Viewer = hero; controls in a
+--------------+-------------------+     collapsible sheet.
```

- Controls panel **left** (~360 px) · 3D viewer **right** (hero, orbit/zoom).
- Header: logo · language (FR/EN) · theme.
- **Mobile-first**: viewer fills the screen; controls in a draggable bottom sheet.

## Flow (one screen, ordered)

1. **Photo** — drop/capture (object + token) → thumbnail with token ring + object contour overlaid.
2. **Auto-detect** — status chips: `Token ✓ 76.2 mm` · `Échelle 0.152 mm/px` · `Contour ✓`;
   clear warning on failure (never a silent fail).
3. **Parameters** — pitch · size (auto from footprint, overridable) · height (×7 mm) ·
   tool thickness (= pocket depth) · clearance offset · lip toggle.
4. **3D preview** — live three.js of the bin + pocket.
5. **Export** — **⬇ STL** (primary) · STEP · 3MF.

## Design system

- **Light, clean, neutral**; the 3D viewer is the hero (lots of space).
- **One accent: calm blue-teal** (primary actions + active states).
- **Monospace** for all numeric values + units (mm) — instrument feel; **Inter** for labels.
- Sliders **paired with a number field** (drag or type).
- **Lucide** icons, hairline dividers, subtle shadows.
- **i18n FR + EN**, structured to add more languages later.
- Tech: **React + Tailwind**; tokens (colors/spacing/typography/radius) defined once.

## Build order (it 4)

Tracer bullet with **manual parameters** (vision wiring is it 6/7):
1. Design system: React + Tailwind + tokens + base components (Button, Slider, NumberField, Panel, Chip).
2. App shell + layout (header, panel, viewer area) + i18n.
3. **Browser replicad init** + mesh the bin → three.js preview (live from params).
4. Export STL (browser download).
5. Photo drop zone + detection **placeholder** (real detection later).
