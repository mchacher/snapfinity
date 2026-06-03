# Plan 026 — crop rectangle with handles

1. **Geometry helpers (pure) + tests** — `photo-transform.ts`: `defaultCropBox`, `CropHandle`,
   `resizeCropBox`, `moveCropBox`. Add `photo-transform.test.ts` cases (each handle resizes the
   right edges, min-size + `[0,1]` clamp; move clamps at the borders).
2. **PhotoOverlay crop rewrite** — replace the drag-to-draw crop with the draft zone: state +
   init effect, pointer branch (move / resize / redraw + handle hit-test + hover cursor), render
   (dimmed outside, red dashed border, 8 handles), Appliquer/Annuler toolbar. New prop
   `onCancelCrop`; `useI18n` for the toolbar labels.
3. **Wiring** — `Workspace.onCrop` also exits crop mode; add `onCancelCrop`; thread both through
   `OutlinePanel` → `PhotoOverlay`.
4. **Control** — `ControlsPanel`: swap the Rogner Toggle for a `Crop`-icon button; update the
   crop hint.
5. **i18n** — `cropApply` / `cropCancel`; tweak `cropHint`.
6. **Validate** — `typecheck` / `lint` / `build`; run vitest; headless visual sanity (enter crop
   mode → zone + handles show, Appliquer crops, Annuler doesn't).

PR on `feat/crop-rectangle`; index row 026; flip 025 → ✅ Done in the same docs touch.
