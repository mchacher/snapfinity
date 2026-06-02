# Spec 008 — UI foundation: design system + app shell

## Overview

First UI iteration (it 4, part 1). Stand up the **design system** (React + Tailwind, tokens,
base components) and the **single-workspace app shell** with **i18n FR/EN**, per
[docs/technical/ui.md](../../docs/technical/ui.md). Parameter controls are wired to local
state; the 3D viewer is a **placeholder**. Live replicad preview + STL export are spec 009;
real photo detection is it 6/7. Deliverable validated by a **screenshot**.

## Goals

- React + Tailwind on the existing Vite project; design **tokens** defined once (light theme,
  calm blue-teal accent, **monospace for numeric values**, Inter for labels).
- **Base components**: Button, Panel, Chip, Slider (paired number field), NumberField, Select, Toggle.
- **App shell**: header (wordmark · FR/EN · theme), left controls panel, right viewer area (placeholder).
- Controls reflect the real parameters (pitch · size · height · thickness · offset · lip).
- **i18n FR + EN**, extensible to more languages.

## Non-goals

- Live 3D preview / browser replicad init (spec 009).
- STL/STEP/3MF export (spec 009).
- Real photo detection / calibration overlay (it 6/7) — a static placeholder only.

## Requirements

- **R1** — React app builds via Vite; Tailwind v4 active.
- **R2** — Tokens (color/space/type/radius) defined once and consumed by components.
- **R3** — Base components implemented and used in the shell.
- **R4** — i18n: FR + EN dictionaries with **identical keys**; a hook/store to switch language.
- **R5** — Responsive: solid desktop layout (panel + viewer); basic mobile (viewer + bottom sheet).

## Acceptance criteria

- [x] React + Tailwind scaffold; `npm run build` green
- [x] Tokens + base components (Button, Panel, Chip, Slider+NumberField, Select, Toggle, Section)
- [x] App shell laid out — flat collapsible sections (Photo / Taille / Général), Export top-right, FR/EN
- [x] i18n FR/EN with a **key-parity test** (no missing translations)
- [x] App **smoke render test** + Toggle interaction tests (no `<label>` double-fire)
- [x] `npm run typecheck | lint | test | build` green (40 tests); CI green on the PR pending
- [x] **Visual OK** from the user (azure accent, flat sections, working toggles)

## Scope

**In**: design system, shell, i18n, parameter controls (state only).
**Out**: 3D preview, export, real vision.

## Edge cases

- i18n: a missing key in one language must fail the test (caught early).
- Numeric fields: show units (mm) and use monospace; invalid input clamped (logic later with preview).
