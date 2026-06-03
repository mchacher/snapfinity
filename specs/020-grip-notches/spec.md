# Spec 020 — two-finger pinch grip (vertical scoops at the object edge)

## Overview

Backlog feature #3. Cut a **two-finger pinch grip**: a **symmetric pair of vertical (Z-axis)
finger scoops** cut down from the top **at the object's edge**, so a finger slides down beside
the tool to lift it out. They default to the object's left/right edge (mid-depth); the user
nudges the pair symmetrically with **X/Y offsets**.

> Revised twice after review: (1) both scoops on one front wall looked mis-placed; (2) scoops on
> the outer side walls were still wrong. The user clarified: the grips must be **at the object
> edge (not the bin's side walls), cut along Z**, with **symmetric X/Y** fine-tuning.

## Goals

- A toggle to add the pinch grip; **size** (radius) + **X offset** + **Y offset** controls.
- Correct default: a symmetric pair at the object's ±X edge, mid-depth.
- The bin's outer envelope (footprint + height) is unchanged — scoops are carved within it.
- Cut in the CAD worker after building the (pocketed) bin.

## Non-goals

- More than two scoops; auto-snapping to a non-rectangular outline (bbox edge is the default).
- A full Gridfinity "scoop ramp" floor feature.

## Requirements

- **Toggle** `gripNotches` (default off) + **radius** (default 9 mm) + **X offset**
  (`notchOffsetXMm`) + **Y offset** (`notchOffsetYMm`), both default 0.
- A symmetric pair of **vertical cylinders** (axis Z) cut from above the rim down to the pocket
  floor, at `(±(edgeX + offsetX), centreY + offsetY)` where `edgeX`/`centreY` come from the
  pocket footprint bbox (bin-based fallback when there's no pocket).
- Geometry: the cut **overshoots the rim** (≥ 5 mm) so the boolean doesn't fail on a
  near-coincident top face; clamp the centres so each scoop stays inside the outer walls.
- Applied in the **CAD worker** after building the bin (with the footprint + depth as context);
  the outer bounding box is preserved.

## Acceptance criteria

- [x] Enabling adds two vertical finger scoops at the object's edge; disabling restores the bin. *(verified visually on a real photo — scissors)*
- [x] X/Y offsets move the symmetric pair.
- [x] Outer dimensions (W×D×H) are unchanged with the grip on.
- [x] Unit test (Node OC): material removed, bbox preserved, X/Y offset changes the shape. `build`/`lint`/`typecheck` clean.

## Scope

**In:** `src/cad/notches.ts` (`cutGripNotches` + `NotchContext`) + test; thread a `notch` config
(+ footprint/depth context) through the CAD worker (`cad-messages`, `cad.worker`, `useBin`);
`Params` + ControlsPanel toggle/size/X/Y sliders; i18n.

**Out:** outline-snapping, more scoops, bottom scoop ramp.

## Edge cases

- **Wall too short** for two scoops → cut one centred, or none (logged), never an invalid solid.
- **Radius too large** vs height → clamp so the scoop stays in the body (above the feet).
- **Notch over the pocket** → fine (the finger reaches the tool); booleans handle it.
