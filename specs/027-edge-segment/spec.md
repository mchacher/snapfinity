# Spec 027 — détourage by edges (transparent / reflective objects)

## Overview

u2netp (saliency) **fails on transparent / clear objects** — a clear-plastic screwdriver on a
white background reads as background, so the contour is a tiny fragment (verified: u2netp covers
0.28 % of the frame). Such objects DO have one strong signal the flat background lacks: **edges**
(refraction outlines, the cap, the metal). Add an **edge-based segmentation** path and pick
between it and u2netp.

- **u2netp (standard)** stays the default — best for opaque objects (clean filled mask).
- **Contours (edges)** — Canny → morphological close → fill → largest blob (minus the token) —
  recovers the full silhouette of a transparent object on a clean background.
- **Auto** (default) — runs u2netp; if it **clearly failed** (tiny coverage) **and** the edge
  silhouette looks like an object (not a textured-background blow-up), use edges. A selector lets
  the user **force** Standard or Contours when Auto guesses wrong.

## Goals

- Make transparent/reflective objects on a clean background détourable (the screwdriver works).
- Don't regress opaque objects — Auto only switches when u2netp produced ~nothing.
- Keep a manual override (the escape hatch when Auto or the background fools it).

## Non-goals

- Robust edge detection on **textured backgrounds** (wood grain explodes the edge silhouette —
  measured 74–93 %). Auto won't pick edges there; the override + brush is the fallback. The
  feature targets clean/uniform backgrounds (where transparent objects are normally shot).
- Perspective/lighting correction; a new ML model.

## Requirements

### Algorithm
- `edgeMask(rgba, w, h)` (pure-ish, opencv): blur → Canny → dilate → morph-close → fill contours →
  binary mask, at the détourage working resolution. The existing `cleanMask` then removes the
  token region + keeps the largest blob (shared with u2netp).
- **Auto selector** (`chooseSegmentMode`, pure + unit-tested): inputs are the cleaned u2netp/edge
  area fractions **and the ratio of their bounding-box areas**. Use `'edges'` when the edge
  silhouette is object-sized (`~1% ≤ edgeFrac ≤ ~55%`, so a textured background doesn't trigger
  it) **and** either u2netp found ~nothing (`< ~2.5%`) **or** u2netp **missed the object's extent**
  (edge bbox ≥ `~1.3×` u2netp's). The extent test matters because a missed thin tip (a tester
  screwdriver's point) is **tiny in area but large in reach** — area alone keeps u2netp wrongly.
  Thresholds are backed by a **browser-measured** dataset table (onnxruntime-web differs a lot
  from node, so node measurements don't transfer).

### UI & params
- New param `segmentMode: 'auto' | 'standard' | 'edges'` (default `'auto'`).
- A **mode selector** (Auto / Standard / Contours) at the top of the **Détourage** section.
- Everything downstream (contour → offset → footprint → bin → PDF) is unchanged — only the source
  mask changes.

## Acceptance criteria

- [ ] On the transparent screwdriver, Auto (and Contours) produce a **full-object** contour where
      Standard gives a fragment (visual oracle overlay committed to the dataset).
- [ ] Opaque dataset photos keep using u2netp under Auto (no regression) — verified by the
      measured table / oracle.
- [ ] `chooseSegmentMode` is **unit-tested** against the measured fractions.
- [ ] Forcing Standard / Contours overrides Auto.
- [ ] `typecheck` / `lint` / `build` clean; full `vitest run` stays green (no hang).

## Scope

**In:** `edgeMask` + `chooseSegmentMode` (vision); `deriveMask` mode plumbing; `useDerivedMask`
+ Workspace param; the Détourage mode selector; i18n; a `verify:seg`-style oracle overlay + the
screwdriver dataset photo.

**Out:** textured-background edge robustness, worker offload, auto-tuned Canny.

## Edge cases

- **Transparent object on wood** → edges explode; Auto stays on u2netp (which is also poor) → the
  user forces Contours knowing the limit, or brushes. Documented, not solved.
- **Edge mask empty** (low-contrast object) → Auto keeps u2netp.
- **Threshold slider** is inert in Contours mode (edges don't use the saliency cut) — that's fine.
