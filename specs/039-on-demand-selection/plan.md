# Plan 039 — on-demand selection

1. `analyze.ts` — `AnalyzeOptions.segment`; skip `runSaliency` when false (`saliency: null`);
   `PhotoAnalysis.saliency: Float32Array | null`; `deriveMask` null-saliency → edge route.
2. `usePhotoAnalysis.ts` — `segmentEnabled` (reset on new photo); pass `segment`; immediate on a
   segment toggle; `requestSegment` / `clearSegment`; `useDerivedMask` returns null when saliency null.
3. `Workspace.tsx` — `onMagicWand`, `onClearSelection`, `hasSelection`; pass to ControlsPanel.
4. `ControlsPanel.tsx` — Sélection: Effacer · Automatique (Détecter + mode + Seuil) · Lasso · Manuel
   (node editor + brush, gated on hasSelection). Move Seuil out of Advanced. i18n (`magicDetect`,
   `clearSelection`).
5. Validate — typecheck / lint / build; full `vitest run` green; headless: load = token only (no
   selection), magic wand → selection, Effacer → none, 0 errors. CHANGELOG; index row 039. Commit
   on `feat/magnetic-lasso`; hold push.
