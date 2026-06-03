# Spec 020 — two-finger pinch grip (opposing wall scoops)

## Overview

Backlog feature #3. Cut a **two-finger pinch grip**: one semicircular finger scoop on each of
the two **longer opposing walls**, facing each other, so the user pinches the tool out from
both sides — the classic Gridfinity grip (per the user's reference photo).

> Revised after review: v1 first cut both scoops on a single front wall, which looked
> mis-placed on long/narrow bins. The correct design is **one scoop per longer opposing wall**,
> centred along the length by default, with a **position** offset to slide the pinch.

## Goals

- A toggle to add the pinch grip; a **size** (radius) control + a **position** control.
- Correct default: scoops centred on the two longer walls, facing each other.
- The bin's outer envelope (footprint + height) is unchanged — scoops are carved within it.
- Works for both the plain bin and the pocketed bin, in the CAD worker.

## Non-goals

- More than two scoops, or scoops on the shorter walls. 
- A full Gridfinity "scoop ramp" floor feature (this is a rim grip, not a bottom ramp).

## Requirements

- **Toggle** `gripNotches` (default off) + a **radius** slider (default 9 mm) + a **position**
  slider (`notchPositionMm`, default 0 = centred, ±100 mm, clamped to the wall).
- One semicircular scoop cut into the **top rim of each longer opposing wall**, axis ⟂ the wall,
  centred on the rim; the pair sits at `positionMm` along the long axis.
- Geometry guards: skip if the wall is too short; clamp `r` so the scoop stays above the feet
  and within the wall, and clamp `positionMm` so the scoop stays on the wall.
- Applied in the **CAD worker** after building the bin (plain or pocketed); the outer
  bounding box is preserved.

## Acceptance criteria

- [x] Enabling adds two opposing finger scoops on the longer walls; disabling restores the plain bin. *(verified visually on a 2×6 bin)*
- [x] Outer dimensions (W×D×H) are unchanged with the grip on.
- [x] The grip bin still meshes + exports (STL/STEP).
- [x] Unit test (Node OC): bbox preserved, meshable, position offset changes the shape. `build`/`lint`/`typecheck` clean.

## Scope

**In:** `src/cad/notches.ts` (`cutGripNotches`) + test; thread a `notch` config through the
CAD worker (`cad-messages`, `cad.worker`, `cad-client`, `useBin`); `Params` + ControlsPanel
toggle/slider; i18n.

**Out:** side/count selection, bottom scoop ramp.

## Edge cases

- **Wall too short** for two scoops → cut one centred, or none (logged), never an invalid solid.
- **Radius too large** vs height → clamp so the scoop stays in the body (above the feet).
- **Notch over the pocket** → fine (the finger reaches the tool); booleans handle it.
