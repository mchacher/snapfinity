# Spec 032 — launch 1.0 (landing page + release process)

## Overview

Make Snapfinity presentable for its first public users (friends), and put a release process in
place. Two parts:

1. **A landing page** — the app booted straight into the workspace, which is confusing for a
   first-time visitor. Add a first-run landing that explains the principle (photo + token → custom
   Gridfinity bin), the 3 steps, and where to get the calibration token.
2. **Release process** — tag this as **v1.0.0**, start a **CHANGELOG**, and make release notes
   **mandatory in CI** from now on.

## Goals

- A clear, attractive landing that a friend lands on and immediately understands what to do.
- Prominent **token download** (the one thing a friend must have).
- Version the project at **1.0.0** and establish a durable, enforced release-notes habit.

## Non-goals

- A separate marketing site / router (the landing is an in-app view).
- Actually flipping the site live / cutting the GitHub Release (ops step after merge).
- Reworking the workspace UI.

## Requirements

### Landing (`src/features/landing/Landing.tsx`)
- First-run **in-app view** (no router): shown until the user clicks **Commencer**; the choice is
  remembered in `localStorage` (`snapfinity.seenLanding`) so returning users go straight to work.
  `App.tsx` switches between `<Landing>` and `<Workspace>` inside the existing `I18nProvider`.
- Sections: header (logo + FR/EN toggle) · hero (badge, title, subtitle, **Commencer** + **token**
  CTAs, faint Gridfinity grid backdrop) · **3-step** how-it-works cards (photograph → detect &
  calibrate → generate & export) · **token band** (download STL + STEP, print/measure note) ·
  privacy strip · footer (open-source, GitHub).
- Reuses the design system (`Logo`, `Button`, accent/slate tokens, lucide icons). **FR/EN i18n**
  under a new `landing` namespace. Token links resolve via `import.meta.env.BASE_URL` (subpath-safe).

### Release process
- `package.json` version → **1.0.0**.
- **`CHANGELOG.md`** (Keep a Changelog + SemVer): a `[1.0.0]` entry summarizing the app + an
  `[Unreleased]` section for going forward.
- **`.github/workflows/changelog.yml`** — on `pull_request`, fail if `CHANGELOG.md` is not in the
  PR diff; **`skip-changelog`** label opts out. Job always runs + always concludes (so it can be a
  required status check). `CLAUDE.md` documents the rule.

## Acceptance criteria

- [x] First visit shows the landing; **Commencer** enters the workspace and is remembered across
      reloads (localStorage).
- [x] Token STL/STEP downloads work from the landing (base-path aware).
- [x] FR/EN toggle on the landing; all copy translated.
- [x] `package.json` is 1.0.0; `CHANGELOG.md` has `[1.0.0]` + `[Unreleased]`; the changelog CI
      gate is present and self-satisfied by this PR.
- [x] `App.test.tsx` updated for the landing-first flow (landing on first visit; workspace after
      Commencer). `typecheck` / `lint` / `build` clean; full `vitest run` green (no hang).

## Scope

**In:** `Landing.tsx`, `App.tsx`, `i18n` `landing` keys, `App.test.tsx`, `package.json`,
`CHANGELOG.md`, `changelog.yml`, `CLAUDE.md`, this spec + index row. **Out:** the live deploy +
the v1.0.0 GitHub Release (ops, post-merge); workspace UI changes.
