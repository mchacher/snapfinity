# Spec 020 — side grip notches (two-finger)

## Overview

Backlog feature #3. Cut **two finger notches** into the rim of one wall so the user can slide
**two fingers of the same hand** in to grab the tool out of the bin.

> Interpretation of the request ("deux encoches sur le côté des outils pour glisser deux doigts
> de la même main"): two rounded scoops in the top rim of the **front** (long) wall, spaced for
> two fingers. Side/count are fixed in v1 (front, 2) — configurability can come later. Flagged
> for review.

## Goals

- A toggle to add two finger scoops; a size control for the scoop radius.
- The bin's outer envelope (footprint + height) is unchanged — notches are carved within it.
- Works for both the plain bin and the pocketed bin, in the CAD worker.

## Non-goals

- Choosing the side or the number of notches (v1: front, 2). 
- A full Gridfinity "scoop ramp" floor feature (this is a rim grip, not a bottom ramp).

## Requirements

- **Toggle** `gripNotches` (default off) + a **radius** slider (default 9 mm).
- Two semicircular scoops are cut into the **front wall's top rim**, centred, spaced for two
  fingers (auto spacing ≈ `max(2·r+6, 28)` mm), each of radius `r`.
- Geometry guards: skip if the wall is too short for two scoops at radius `r`; clamp `r` so the
  scoop doesn't reach below the body into the feet.
- Applied in the **CAD worker** after building the bin (plain or pocketed); the outer
  bounding box is preserved.

## Acceptance criteria

- [ ] Enabling adds two rounded finger notches on the front rim; disabling restores the plain bin. *(user to verify visually)*
- [ ] Outer dimensions (W×D×H) are unchanged with notches on.
- [ ] The notched bin still meshes + exports (STL/STEP).
- [ ] Unit test (Node OC): notches preserve outer bbox + still meshable. `build`/`lint`/`typecheck` clean.

## Scope

**In:** `src/cad/notches.ts` (`cutGripNotches`) + test; thread a `notch` config through the
CAD worker (`cad-messages`, `cad.worker`, `cad-client`, `useBin`); `Params` + ControlsPanel
toggle/slider; i18n.

**Out:** side/count selection, bottom scoop ramp.

## Edge cases

- **Wall too short** for two scoops → cut one centred, or none (logged), never an invalid solid.
- **Radius too large** vs height → clamp so the scoop stays in the body (above the feet).
- **Notch over the pocket** → fine (the finger reaches the tool); booleans handle it.
