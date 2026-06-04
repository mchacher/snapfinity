# Plan 039 — on-demand selection (as shipped)

The plan started as "defer u2netp to a magic-wand trigger" and grew, across many review rounds, into
a full détourage + workspace rework. Delivered in one branch (`feat/magnetic-lasso`, **PR #42**),
bundling specs 037 (lasso) + 038 (panel) + 039.

1. **Defer segmentation** — `analyze.ts` `AnalyzeOptions.segment` (skip `runSaliency` → `saliency:
   null`); `deriveMask` null-saliency → edge route; `+resolvedMode`. `usePhotoAnalysis`
   `segmentEnabled` + `requestSegment`/`clearSegment`; `useDerivedMask` → `{ derived, deriving }`,
   gated on saliency, commit-on-release threshold, pinned resolved method, recompute spinner.
2. **Selection state** — Workspace `onMagicWand`, `onClearSelection`, `hasSelection`. Manual lasso →
   `vision/raster.ts maskFromRing` → `manualMask`; `baseMask = manualMask ?? derived`; `hasMask`
   (tools) vs `isAutoMask` (method step). Smoothing scaled to contour size; Redresser single slider
   (0 = off).
3. **Wizard** — `selectionStep` (`method`/`adjust`); subsection title = the step. Tools as rows;
   brush/points options in a toolbar over the photo; Lissage/Redresser/Jeu/Opacité inline.
4. **Photo workspace** — OutlinePanel toolbar zone + canvas; PhotoOverlay contain-fit
   (`ResizeObserver`) + zoom/pan transform + controls.
5. **Polish** — panel reorg (no "Réglages avancés"), type scale rebalanced (14→13 body, 12→11 fine
   print, kicker titles kept), small/right-aligned Cadrage buttons, i18n.
6. **Validate** — typecheck / lint / build clean; full `vitest run` green (146); headless across the
   flows (token-only load, detect → method → adjust → effacer, lasso → all tools, zoom, aspect-fit).
   CHANGELOG; index row 039. Merged via PR #42 (deploy stays manual — no release).

> Docs synced post-merge on branch `docs/sync-detourage`.
