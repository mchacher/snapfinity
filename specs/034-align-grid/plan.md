# Plan 034 — alignment grid

1. **Param** — `Workspace.tsx`: add `showGrid: boolean` to `Params` (+ `showGrid: false` in
   `initialParams`).
2. **Toggle** — `ControlsPanel.tsx`: in the `Affichage` section, add
   `<Toggle label={t('params.grid')} checked={params.showGrid} onChange={(v) => set('showGrid', v)} />`.
3. **Plumb** — `OutlinePanel.tsx`: pass `showGrid={params.showGrid}` to `PhotoOverlay`.
4. **Overlay** — `PhotoOverlay.tsx`: add `showGrid?: boolean` prop; render the grid `<svg>` (image-
   px viewBox, `preserveAspectRatio="none"`, non-scaling 1 px accent lines, ~10 cells on the short
   side) right after the canvas, guarded by `showGrid && width && height`.
5. **i18n** — `params.grid` in `en.ts` ("Alignment grid") + `fr.ts` ("Grille d'alignement").
6. **Docs + changelog** — index row 034; CHANGELOG `[Unreleased]` entry (mandatory gate).
7. **Gate** — `typecheck` / `lint` / `build`; full `vitest run` green; headless screenshot of a real
   photo with the grid on (lines align + scale) and off. Branch `feat/align-grid`, PR, merge after
   CI, redeploy Pages.
