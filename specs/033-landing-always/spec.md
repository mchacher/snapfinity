# Spec 033 — landing on every visit + home button

## Overview

The landing (spec 032) was remembered in `localStorage` and skipped on return, so reopening the
link dropped you straight into the workspace — you couldn't get back to the landing. Make the
landing the **front door on every visit**, and add a way back from the workspace.

## Goals

- Reopening the site always shows the landing; **Commencer** enters the workspace.
- The workspace **logo is a clickable "home"** that returns to the landing.

## Non-goals

- Routing / URLs (still a single in-app view toggle).
- Any persistence (removed entirely).

## Requirements

- `App.tsx` holds a plain `started` boolean (initial `false`) — **no `localStorage`**. `<Landing
  onStart>` ↔ `<Workspace onHome>`.
- `Workspace` accepts an optional `onHome` and threads it to `Header`.
- `Header` wraps the logo + wordmark in a `button` (`onClick={onHome}`, `aria-label`
  `header.home`) — back to the landing.
- i18n: `header.home` (FR "Retour à l'accueil" / EN "Back to home").

## Acceptance criteria

- [x] Landing shows on every load; **Commencer** → workspace; workspace **logo** → landing.
- [x] `App.test.tsx` covers the round-trip (landing → workspace → home → landing).
- [x] `typecheck` / `lint` / `build` clean; full `vitest run` green (no hang).

## Scope

**In:** `App.tsx`, `Workspace` + `Header` (`onHome`), `header.home` i18n, `App.test.tsx`, CHANGELOG
`[Unreleased]`, this spec + index row. **Out:** routing, persistence.
