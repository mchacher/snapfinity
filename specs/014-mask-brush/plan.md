# Plan — 014 mask brush

## Implementation steps

1. **Pure `mask-edit.ts` + tests** — `paintDisc`, `compositeMask`. (No cv/DOM.)
2. **`applyEdits`** in `analyze.ts` — composite base⊕edit → `outerContour` (cv) + `maskBBox`,
   scaled to full-res → effective `DerivedMask`.
3. **`useMaskEdit` + `useEditedMask`** — edit-layer buffer (sized to base, reset on new base),
   `paint`/`reset`/`version`; debounced cv recompute of the edited mask.
4. **`PhotoOverlay`** — pointer drag → `onPaint(maskX, maskY)` (canvas→mask mapping); brush cursor.
5. **`OutlinePanel` + `Workspace`** — own edit layer + edited mask; feed contour/tint/auto-size
   from the edited mask; pass paint callback + brush size to the overlay.
6. **`ControlsPanel`** — Pinceau section: Ajouter/Enlever (Toggle), Taille (Slider), Réinitialiser.
7. **i18n** — brush, add, erase, size, reset.

## Task breakdown

- [x] `paintDisc` + `compositeMask` + `mask-edit.test.ts` (4)
- [x] `applyEdits` (cv) in analyze
- [x] `useMaskEdit` hook (edit layer + paint/reset/version, throttled re-derive)
- [x] `PhotoOverlay` painting + brush cursor ring
- [x] `OutlinePanel`/`Workspace` wiring (edited mask everywhere); `brushMode`/`brushSize` params; reset on upload
- [x] `ControlsPanel` Pinceau section + i18n
- [x] typecheck/lint/test(71)/build green; verified via Playwright (erase bites the contour, no crash)

## Test plan (before code)

| Module | Nominal | Edge | Type |
| ------ | ------- | ---- | ---- |
| `paintDisc` | stamps a filled disc of `value` at (cx,cy,r); pixels outside untouched | disc clipped at bounds; r=0 → single/none | unit |
| `compositeMask` | base on + erase(2) → 0; base off + add(1) → 255; neutral → base | all-neutral → base unchanged | unit |
| `applyEdits` (cv) | erased region drops from contour; added region joins it | empty effective mask → outline `[]`, bbox null | **manual + verify** |
| paint UX | drag in Add grows the mask/contour; Erase shrinks; persists across threshold/flatten | new photo resets edits | **manual visual** |

**Manual/visual:** `npm run dev` → upload the cutter, Erase-paint the right-side shadow → the
contour pulls in to the knife; upload a missed-region photo, Add-paint it → contour grows.
Toggle Flatten/Threshold → edits persist. Reset clears them.

## Out of scope (next)

- 015: contour **point-editing** (drag handles) for fine polish.
- Feathered brush, lasso, undo/redo; interior holes; 3D pocket from the contour.
