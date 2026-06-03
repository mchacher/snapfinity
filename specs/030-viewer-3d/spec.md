# Spec 030 — 3D viewer polish (grid · orientation cube · fit-to-view · edges)

## Overview

The 3D preview rendered the bin on a bare gradient with only orbit controls — no spatial
reference and no quick way to recentre. gridfinity-generator's viewer feels much nicer because of
four small touches. Add the same, all via `@react-three/drei` (already a dependency), no new libs.

- **Ground grid** — a faint floor grid under the bin (a Gridfinity unit per cell) for scale and
  grounding, like gridfinity-generator.
- **Orientation cube** — a clickable `GizmoViewcube` (Top / Right / Bottom… faces) bottom-right,
  preferred over an xyz-axis gizmo; click a face to snap the camera.
- **Fit-to-view** — a "Ajuster la vue" button (bottom-left) that recentres the camera on the bin,
  and the same auto-fit runs whenever the geometry changes (`Bounds` + `useBounds`).
- **Visible edges** — `<Edges>` overlays the bin's hard edges (like the contour lines in
  gridfinity-generator), readable on both the opaque and translucent bin.

## Goals

- A grounded, easy-to-read 3D preview with one-click recentre and orientation snapping.
- Edges visible in both render modes (opaque + translucent).
- No regression to the existing two-pass translucency (the opacity slider still shows the pocket
  through the walls).

## Non-goals

- Camera animation tuning beyond drei defaults; shadows/AO; a custom gizmo.
- Changing geometry, export, or any CAD parameter.

## Requirements

- **Grid** — drei `<Grid>`, `cellSize` 42 mm (one standard Gridfinity unit), section every 5
  cells, placed at the bin base (`y ≈ 0` after the `rotation={[-Math.PI/2,0,0]}`), `infiniteGrid`,
  faded with distance.
- **Orientation cube** — `<GizmoHelper alignment="bottom-right"><GizmoViewcube/></GizmoHelper>`
  with localized face labels (FR: Dessus/Dessous/Avant/Arrière/Gauche/Droite). White faces, accent
  hover, slate text/stroke to match the UI.
- **Fit** — wrap the bin in `<Bounds clip>`; a `FitController` (inside the Canvas) exposes
  `bounds.refresh().clip().fit()` via a ref for the on-screen button **and** auto-fits on each
  geometry change. The button shows only when a bin is `ready`.
- **Edges** — `<Edges threshold={20}>` (degrees) as a child of the bin mesh; rendered on the
  opaque mesh and on the front-face mesh of the translucent pair.
- **Opacity flip is bulletproof** — switching the opacity slider to **1** (translucent → opaque)
  must give a **fully opaque blue** bin. Distinct React `key`s per branch (`bin-back`/`bin-front`
  vs `bin-solid`) + explicit `transparent`/`opacity`/`depthWrite` on every material, so R3F never
  reuses a fiber and leaves stale `transparent`/`depthWrite:false` (which left the bin see-through
  at opacity 1).

## Acceptance criteria

- [x] Ground grid visible under the bin; cube bottom-right; "Ajuster la vue" bottom-left; edges on
      the bin — verified by headless screenshots (opaque + translucent).
- [x] Opacity = 1 → solid opaque blue (no transparency); dragging down to 0.4 and back to 1 stays
      correct (flip both ways).
- [x] Auto-fit on geometry change; button recentres.
- [x] FR + EN labels (`viewer.fit`, `viewer.face.*`).
- [x] `typecheck` / `lint` / `build` clean; full `vitest run` green (131 tests, no hang).

## Scope

**In:** `Viewer.tsx` (grid, cube, Bounds/FitController, Edges, keyed materials); `viewer.fit` +
`viewer.face.*` i18n (en/fr). **Out:** geometry, export, CAD params, shadows.
