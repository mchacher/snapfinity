# Plan 038 — controls panel reorganization

1. `ui/Disclosure.tsx` — nested collapsible (closed by default).
2. `ControlsPanel.tsx` — add a `SubHead` helper; rewrite the outline-tab return into two `Section`s
   (Image, Détourage) with subheads + two `Disclosure`s, re-parenting the existing control JSX
   (no behavior change).
3. i18n — `params.adjustments` / `params.refine` / `params.advanced` (fr + en).
4. `App.test.tsx` — assert "Méthode" instead of the removed "Calibrage".
5. Validate — typecheck / lint / build; full `vitest run` green (no hang); headless screenshots
   (collapsed + expanded). CHANGELOG `[Unreleased]`; index row 038. Commit on `feat/magnetic-lasso`
   (bundled with the lasso); hold push for the user's go.
