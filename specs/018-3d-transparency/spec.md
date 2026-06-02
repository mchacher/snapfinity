# Spec 018 — 3D render transparency

## Overview

Add an **opacity slider** on the Preview tab that makes the 3D bin translucent, so the user
can **see inside** — especially the tool pocket cut into the body, which is otherwise hidden
behind opaque walls.

## Goals

- A live control to dial the bin from opaque to translucent.
- Reveals the pocket cavity and internal geometry without rotating under the model.

## Non-goals

- Per-part / cross-section / clipping-plane views.
- Wireframe, X-ray, or a separate "ghost" material.
- Any change to the geometry or the export (purely a render setting).

## Requirements

- An **Opacity** slider in a new "Render" section of the Preview-tab controls, range
  `0.2 … 1`, default **1** (opaque — no behavioural change until the user touches it). The
  0.2 floor keeps the model always visible.
- The 3D material becomes `transparent` when opacity < 1, with that opacity applied. When
  translucent, faces must **not self-occlude**, so the pocket/interior is visible through the
  front wall.
- The setting is preview-only and does not affect the exported STL/STEP.

## Acceptance criteria

- [ ] Lowering the slider makes the bin translucent and the pocket cavity becomes visible. *(user to verify)*
- [ ] At opacity = 1 the render is identical to today (fully opaque). *(user to verify)*
- [x] Export is unaffected (purely a material setting; no geometry/export code touched).
- [x] `build`, `lint`, `typecheck` clean; 83 tests pass.

## Scope

**In:** a `renderOpacity` param, the slider (ControlsPanel, Preview tab), the material wiring
(Viewer), FR/EN i18n strings.

**Out:** clipping planes, wireframe, anything geometry/export-related.

## Edge cases

- **opacity = 1** → `transparent` off, default render (no transparency cost/artefacts).
- **Very low opacity** → floored at 0.2 so the model never vanishes.
- **No geometry yet** (loading/error) → slider has no visible effect; harmless.
