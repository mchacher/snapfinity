# Plan 035 — editable contour (iteration 1)

1. **Geometry (`core/contour.ts`) + tests** — `simplifyForEdit(ring, {target,max})`,
   `nearestNode(ring, p, maxDist)`, `nearestSegment(ring, p, maxDist) → {index, point}|null`,
   `moveNode(ring, i, p)`, `insertNode(ring, afterIndex, p)`, `deleteNode(ring, i)` (keep ≥ 3).
   Pure, unit-tested (`core/contour.test.ts` already exists — extend it).
2. **Workspace** — `editedContour` state; `const autoContour = …; const contour = editedContour ??
   autoContour;`. Clear `editedContour` when a new framed photo arrives. `FrameTool` += `'contour'`.
   Pass `editedContour`, `onEditContour`, `onResetContour` down; seed on entering edit mode.
3. **ControlsPanel** — Détourage section: *Modifier le contour* toggle; in edit mode show
   *Réinitialiser* + *Terminer* + hint; "contour manuel" badge when set.
4. **PhotoOverlay** — contour edit overlay: dim veil + SVG polygon + node handles; drag (local →
   commit on up), click-segment insert, dblclick delete; suppress canvas auto-contour while editing.
5. **OutlinePanel** — thread `tool='contour'`, `editedContour`, `onEditContour`.
6. **Undo/redo** — add `editedContour` to `Snapshot` (`useUndoRedo`): capture + restore.
7. **i18n** — `params.editContour`, `resetContour`, `doneContour`, `manualBadge`, `editHint` (en/fr).
8. **Validate** — `typecheck` / `lint` / `build`; full `vitest run` green; headless screenshot of the
   editor (dimmed photo + nodes), a drag, add, delete, reset. CHANGELOG `[Unreleased]`; index row 035.
   Commit locally; **hold push/PR/merge for the user's go**.
