# Spec 035 — editable détourage (contour with draggable nodes)

## Roadmap (3 iterations)

A better détourage, in three steps. This spec is **iteration 1**.

1. **035 — Editable contour (this spec).** Make the *current* détourage contour editable by hand:
   draggable nodes, add/remove, in a focused edit mode. Method-agnostic — works on whatever the
   contour was derived from. The edited polygon overrides the auto contour downstream.
2. **036 — GrabCut generator.** A semi-auto selection: drag a rough rectangle → opencv `grabCut`
   → mask → contour, which then flows into the same editable contour (035).
3. **037 — Magnetic lasso (live-wire).** Trace the boundary; the path snaps to edges
   (Intelligent Scissors / Dijkstra on a gradient cost map) → a polyline → editable (035).

Each step ends at the same editable contour, so nothing is thrown away.

## Overview (iteration 1)

Today the contour is derived automatically (u2netp / edges / brush) and feeds the pocket. When the
auto result is *almost* right, the only fix is the mask brush — clumsy for boundary tweaks. Add a
**direct contour editor**: click *Modifier le contour*, the photo dims, and the détourage shows as
a polygon with **draggable handle points**; drag / add / remove nodes; the edited polygon becomes
the contour everywhere downstream.

## Goals

- Edit the detected outline by hand: **drag** a node, **add** a node on a segment, **remove** a node.
- A **focused** edit mode: the photo recedes so the contour + nodes stand out ("on ne voit plus que
  le détourage").
- The edited contour **overrides** the auto one for offset → pocket → 3D → PDF, live.
- **Reset** back to the auto contour at any time.

## Non-goals (this iteration)

- GrabCut (036) and the magnetic lasso (037).
- Bézier/curved handles — straight-segment polygon only.
- Per-node corner/smooth typing.

## Requirements

- **Effective contour** — `contour = editedContour ?? autoContour`; everything downstream
  (`offsetContour`, `footprintMm`, PhotoOverlay draw, PDF) already consumes `contour`, so the
  override is a single seam in `Workspace`.
- **Tool mode** — `FrameTool` gains `'contour'`. A *Modifier le contour* button in the **Détourage**
  controls enters it; entering seeds `editedContour` from `simplifyForEdit(autoContour)` (~24–40
  nodes) if not already set.
- **Editor overlay** (`PhotoOverlay`, contour mode) — a **dimming veil** over the photo + an **SVG**
  drawing the editable polygon and round node handles. Interactions (pointer → image px via the
  existing `toImg`): **drag** a node to move (smooth, local during drag, commit on release),
  **click a segment** to insert a node there, **double-click** a node to delete it (keep ≥ 3). The
  canvas auto-contour is suppressed while editing (no double line).
- **Reset / done** — *Réinitialiser le contour* clears `editedContour` (back to auto); *Terminer*
  leaves edit mode. When `editedContour` is set, the détourage is shown as manual (a small badge).
  A new photo / re-framing clears it (stale); changing détourage method/threshold does **not**
  (manual wins until reset).
- **Undo/redo** — `editedContour` joins the history `Snapshot` so node edits undo/redo with the
  rest (spec 025).
- **Pure geometry** (`core/contour.ts`, unit-tested) — `simplifyForEdit`, nearest-node hit-test,
  nearest-segment hit-test + insertion point, move/insert/delete on a closed polygon.
- i18n FR/EN for the new labels.

## Acceptance criteria

- [ ] *Modifier le contour* opens a focused editor (dimmed photo + contour + node handles).
- [ ] Drag moves a node; click on a segment adds one; double-click removes one (≥ 3 kept); the
      pocket/PDF follow the edited contour.
- [ ] *Réinitialiser* returns to the auto contour; a new photo clears the edit.
- [ ] Node edits undo/redo.
- [ ] Geometry helpers unit-tested; `typecheck` / `lint` / `build` clean; full `vitest run` green
      (no hang). CHANGELOG `[Unreleased]` entry.

## Scope

**In:** `editedContour` state + override (Workspace), `'contour'` tool + button (ControlsPanel),
the editor overlay (PhotoOverlay), `core/contour` helpers + tests, history field, i18n, this spec +
index row. **Out:** GrabCut (036), lasso (037), curves.
