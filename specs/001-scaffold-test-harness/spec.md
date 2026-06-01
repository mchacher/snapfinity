# Spec 001 — Scaffold & test harness

## Overview

Iteration 0 of the roadmap. Set up the project skeleton, the unit-test harness, and CI so
that **every later iteration ships with tests**. No product logic (vision / CAD / UI) — only
the foundation that makes "tests from day one" real.

## Goals

- A **TypeScript + Vite** app skeleton at the repo root (framework-agnostic).
- A **Vitest** unit-test harness with one passing sample test.
- **ESLint + Prettier** configured.
- **GitHub Actions CI** running typecheck + lint + test + build on every push/PR.
- A directory convention: **pure logic (`src/core/`) isolated from WASM/DOM**.
- The **GitHub repo created**; CI green on the first PR.

## Non-goals

- No UI framework (decided at it 4).
- No vision/CAD/WASM dependencies (opencv.js, replicad, three.js, clipper).
- No calibration/sizing logic (that is it 1).

## Requirements

- **R1** — `npm install` sets up the project on Node 20+.
- **R2** — `npm run typecheck` (`tsc --noEmit`, strict) → 0 errors.
- **R3** — `npm run lint` → 0 errors.
- **R4** — `npm test` (`vitest run`) → all pass, including one sample unit test in `src/core/`.
- **R5** — `npm run build` (`vite build`) → succeeds.
- **R6** — CI runs R2–R5 on push/PR and is green.
- **R7** — Convention documented: `src/core/` = pure, framework-free, unit-tested; WASM
  adapters and UI come later in their own dirs.

## Acceptance criteria

- [x] TS + Vite skeleton at repo root (package.json, tsconfig, vite config, index.html, src/main.ts)
- [x] `src/core/` exists with a pure sample module + a passing Vitest test
- [x] `npm run typecheck | lint | test | build` all green locally
- [x] `.github/workflows/ci.yml` runs the four checks
- [ ] GitHub repo created, branch pushed, PR opened, **CI green on the PR**
- [x] CLAUDE.md "Build & run" filled; the core/adapters/ui convention documented

## Scope

**In**: scaffold, test harness, lint/format, CI, directory convention, GitHub repo.
**Out**: UI framework, any WASM, any domain logic.

## Edge cases

- CI pins **Node 20** for reproducibility.
- Lint config covers `.ts` **and** test files.
- TypeScript **strict** on from the very start.
