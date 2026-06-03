# Spec 026 — crop: adjustable rectangle with handles

## Overview

Replace the current **crop** interaction (a toggle, then drag a rectangle from scratch) with a
standard **crop tool**:

- The crop tool is triggered by the **usual crop pictogram** (a `Crop` icon button) in the
  **Cadrage** section — no more on/off Toggle.
- On click, a **crop zone is proposed immediately** over the photo, drawn with **red dashed
  lines** (a default inset rectangle, or the user can redraw it), with **drag handles** to
  resize and a draggable interior to move it. The area outside the zone is dimmed.
- The crop is **applied once**, on an explicit **"Appliquer"** action — not live — so the
  expensive re-analysis (~2–3 s) runs a single time instead of on every handle move.

This refines spec **024** (photo framing); the rotation / 90°-turn / straighten tools are
unchanged. Only the crop sub-tool's UX changes; the underlying `cropRect` param + transform
pipeline stay the same.

## Goals

- A familiar, discoverable crop UX: click the crop icon → a proposed red dashed zone appears →
  adjust it (resize handles + move) → Appliquer.
- One re-analysis per crop (apply on confirm), not one per adjustment.
- Keep progressive cropping (a crop over an already-cropped view composes, as today).

## Non-goals

- Aspect-ratio locking / fixed ratios.
- Live re-analysis while dragging the zone.
- Any change to rotation, 90° turns, straighten, or the `cropRect` transform math itself.

## Requirements

### Tool & interaction
- The **Rogner** control becomes a **`Crop`-icon button** (highlighted when active); clicking it
  enters/exits crop mode (`frameTool === 'crop'`).
- On entering crop mode, a **default crop zone** is shown immediately (a centred inset rectangle,
  ~84 %), drawn as a **red dashed border** with the outside **dimmed**, and **8 handles** (4
  corners + 4 edge midpoints).
- **Resize**: dragging a handle moves the edge(s) it controls (min size enforced, stays within
  the image). **Move**: dragging inside the zone translates it (stays within the image).
  **Redraw**: dragging from outside the zone draws a fresh rectangle.
- An on-photo toolbar with **Appliquer** (primary, ✓) and **Annuler**:
  - **Appliquer** → applies the zone as the crop (composes with any existing crop, re-analysis)
    and **exits** crop mode.
  - **Annuler** → exits crop mode with **no change**.
- Re-clicking the crop icon while active also exits without applying (same as Annuler).

### Pipeline
- No new params. Applying calls the existing crop path (`onCrop` → `composeCrop` → `cropRect`),
  so token / scale / contour / auto-size / 3D / PDF all re-derive as before.

## Acceptance criteria

- [ ] Clicking the crop icon shows a red dashed proposed zone immediately, with handles, outside
      dimmed.
- [ ] Handles resize the zone; the interior drags it; dragging outside redraws it; all clamped
      to the image with a minimum size.
- [ ] **Appliquer** crops to the zone and exits crop mode; the whole pipeline re-derives.
- [ ] **Annuler** (or re-clicking the icon) exits with no crop change.
- [ ] The crop-zone geometry helpers (default box, resize-by-handle, move) are **unit-tested**.
- [ ] `build` / `lint` / `typecheck` clean; the interaction is a **manual visual** check.

## Scope

**In:** crop-zone geometry helpers (pure, in `photo-transform.ts`); `PhotoOverlay` crop-mode
rewrite (proposed zone + handles + move/resize/redraw + on-photo Appliquer/Annuler); the
`Crop`-icon control in `ControlsPanel`; exit-on-apply wiring in `Workspace`; i18n.

**Out:** rotation/straighten changes, aspect locking, live re-analysis.

## Edge cases

- **Tiny zone** → a minimum side is enforced so the crop is never degenerate.
- **Redraw drag smaller than the min** → clamped to the min size.
- **Apply with the default (full-ish) zone** → still a valid (slight) crop; `composeCrop` nests it.
- **Leaving crop mode without applying** → no param change, history untouched.
