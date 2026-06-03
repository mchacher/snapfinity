# Plan 030 — 3D viewer polish

1. **`Viewer.tsx`** — rewrite the scene:
   - add `<Grid>` ground (cellSize 42, section 210, `infiniteGrid`, faded) at `y ≈ 0`;
   - wrap the bin in `<Bounds clip>` + a `FitController` (auto-fit on geometry change, exposes
     `fit()` via `fitRef`);
   - add `<GizmoHelper bottom-right><GizmoViewcube/></GizmoHelper>` with localized faces;
   - add `<Edges threshold={20}>` to the opaque mesh and the translucent front mesh;
   - **keyed materials** (`bin-back`/`bin-front`/`bin-solid`) + explicit
     `transparent`/`opacity`/`depthWrite` so opacity = 1 is fully opaque;
   - HTML "Ajuster la vue" button (lucide `Maximize2`, bottom-left) → `fitRef.current?.()`,
     shown only when `geometry && status === 'ready'`.
2. **i18n** — add `viewer.fit` + `viewer.face.{top,bottom,front,back,left,right}` to `en.ts` and
   `fr.ts`.
3. **Validate** — `typecheck` / `lint` / `build`; full `vitest run` (131 green, no hang);
   headless Playwright screenshots: empty + opaque + translucent + opacity-flip (both ways).
4. **Ship** — branch `feat/viewer-3d`, index row 030, PR, merge after CI.

> Side fixes folded in (reported during review): the opacity-1 transparency bug (keyed materials,
> above) and the **Taille** row alignment in `ControlsPanel.tsx` (left-aligned `flex-1` → right
> `justify-between`, matching the other param rows).
