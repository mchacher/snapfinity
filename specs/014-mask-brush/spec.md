# Spec 014 — Mask brush (manual add / erase)

## Overview

Iteration 8 (part 3) — the manual safety net for the détourage. The auto pipeline (flatten +
threshold + smoothing) handles most photos, but some cases it can't fix on its own (a cast
shadow it confidently segments, a glossy object it misses — the cutter, the chrome fork). Let
the user **paint to add or erase regions** of the mask directly on the photo, and re-derive the
contour from the edited mask. This is what makes the tool reliable on real photos.

## Goals

- A **brush** over the Outline photo: **Add** mode paints object, **Erase** mode removes it.
- A **brush size** control.
- Edits live in a **separate layer composited over the auto mask**, so they **persist** when
  the user changes Flatten / Threshold / Exposure (which re-run the auto mask).
- The green tint updates **live** while painting; the **contour re-derives** from the edited
  mask (throttled / on stroke end).
- **Reset retouches** clears the edit layer; a new photo resets it automatically.

## Non-goals (later)

- Feathered/soft brush, smart edge-snap, polygon lasso — a plain disc brush for now.
- Interior holes (still outer-contour only — decisions #13).
- Undo/redo stack (Reset only for now).
- Feeding the contour into the 3D pocket / export — separate iteration.

## Requirements

- **R1 — Pure edit ops.** `paintDisc(layer, w, h, cx, cy, radius, value)` (stamp a disc) and
  `compositeMask(base, edit)` (base ∨ add, then − erase → effective 0/255). Both pure, unit-tested.
- **R2 — Edit layer.** A `Uint8Array` at the **work-res** of the auto mask (0 = neutral,
  1 = force-on, 2 = force-off). Allocated to the mask dims; **reset on new photo**.
- **R3 — Effective mask + contour.** Composite base⊕edit → effective mask; re-run `outerContour`
  (cv) + `maskBBox` → an effective `DerivedMask`. Smoothing + clearance + auto-size + the tint
  all flow from this. Cheap at work-res (≤1024).
- **R4 — Painting.** Pointer drag on the overlay paints discs into the edit layer (mapped
  canvas→mask px). Tint updates live; contour recomputes throttled / on pointer-up.
- **R5 — Controls.** A **Pinceau** section (Outline left panel): **Ajouter / Enlever** mode,
  **Taille** slider, **Réinitialiser** button. A brush cursor/preview on the canvas.

## Acceptance criteria

- [x] `paintDisc` + `compositeMask` (pure) + unit tests (4)
- [x] Edit layer (work-res) composited over the auto mask; persists across flatten/threshold/
      exposure changes (re-applied on base change); resets on new photo + Reset button
- [x] Add paints / Erase removes on the photo; contour + green tint update from the edited mask
- [x] Brush mode + size controls in a Pinceau section; visible brush cursor ring
- [x] `npm run typecheck | lint | test (71) | build` green
- [x] Verified via Playwright: erase stroke on the scissors handle bit the mask + the contour
      re-derived to follow; Reset activated; no crash (cutter shadow = user's interactive check)

## Edge cases

| Case | Behaviour |
| ---- | --------- |
| Paint before any photo | Brush inert (no mask yet) |
| Re-infer (flatten/threshold) after painting | Edits persist (same work-res); recomposite |
| Erase everything | Empty mask → no contour; bbox null (no auto-size crash) |
| Huge brush near edges | Disc clipped to bounds |

## Note — pure vs cv

`paintDisc` + `compositeMask` are pure (unit-tested). Building the cv Mat from the effective
mask + `outerContour` is the cv part (validated by manual paint + the existing verify path).
Pointer handling is DOM — manual visual check.
