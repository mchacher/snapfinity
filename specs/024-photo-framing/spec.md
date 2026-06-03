# Spec 024 — photo framing: straighten + crop

## Overview

Add two **photo pre-processing** tools on the Outline tab, applied **before** analysis so the
whole pipeline (token → scale → segmentation → contour → bin → PDF) stays consistent:

- **Straighten** — the user draws a **line between two points** along something that should be
  level (a table/paper edge); the photo rotates so that line becomes **horizontal or vertical**
  (auto-snap to the nearer axis).
- **Crop** — the user drags a **rectangle**; only the inside is kept.

Order: **straighten → crop** (cropping trims the empty corners the rotation creates).

## Goals

- Fix tilted / cluttered phone photos so detection works on a clean, level frame.
- Everything downstream re-derives automatically (scale, contour, auto-size, 3D, PDF).
- The straighten interaction is the "draw a line" gesture the user asked for.

## Non-goals

- Perspective / keystone correction (this is a rotation + axis-aligned crop only).
- Live (continuous) re-analysis — these are **one-shot gestures** (draw → re-analyse once).
- Moving vision off the main thread (the worker, spec 018, stays deferred — see the caveat).

## Requirements

### Tools & interaction
- A **"Cadrage" (framing) section** on the Outline tab with **Redresser** / **Rogner** tools
  (and the existing brush), one active at a time, + a **Reset** per tool.
- **Straighten**: drag a 2-point line on the photo → on release, compute the line's angle and
  rotate so it snaps to the nearest axis (horizontal or vertical). The rotation **accumulates**
  (the line is drawn on the current view). Show the applied angle.
- **Crop**: drag a rectangle on the (straightened) photo → keep the inside. Drawn in the current
  view; stored normalised to the rotated image.

### Transform & pipeline
- New params: `straightenDeg` (rotation, default 0) + `cropRect` (normalised `{x,y,w,h}` of the
  rotated image, default null = full).
- The decoded photo is **rotated then cropped** to produce the analysed image; token detection +
  segmentation run on it. The **file is decoded once** (cached); only the transform + analysis
  re-run when `straightenDeg` / `cropRect` change (debounced, like brightness/contrast).
- The overlay draws the transformed photo; the contour/token overlays are already in
  transformed-image space, so they stay aligned.

## Acceptance criteria

- [ ] Drawing a straighten line levels the photo (snaps to H/V); the angle shows; Reset undoes it.
- [ ] Drawing a crop rectangle keeps only the inside; Reset restores the full photo.
- [ ] After straighten/crop, the token re-detects, the contour/scale/auto-size/3D/PDF all stay
      consistent with the new frame.
- [ ] Pure transform math (angle from 2 points + H/V snap; crop-rect mapping) is **unit-tested**.
- [ ] `build`/`lint`/`typecheck` clean; the vision part is a **manual visual** check on a photo.

## Scope

**In:** transform math (pure) + applying it at decode/analysis; `PhotoOverlay` tool modes
(straighten line + crop rect drawing); a Cadrage section + params; i18n.

**Out:** perspective correction, worker, non-gesture live adjust.

## Edge cases

- **Rotation empty corners** → left transparent/white until cropped; the user crops to remove
  them (and detection ignores uniform borders anyway).
- **Token lost after transform** (e.g., cropped out) → the existing "token introuvable" state.
- **Each gesture re-runs the full analysis (~2–3 s, a brief freeze)** — acceptable for a one-shot
  gesture; the deferred **vision worker** would remove the freeze if it becomes annoying.
