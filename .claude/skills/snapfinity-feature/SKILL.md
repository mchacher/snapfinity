---
name: snapfinity-feature
description: |
  Creates features for Snapfinity — a 100%-browser tool that turns a photo of an object
  into a custom Gridfinity bin. Use when:
  - User asks to "create a feature", "implement X", "add X" for Snapfinity
  - User says "créer une feature", "ajouter une fonctionnalité", "implémenter"
  Domains: photo upload, opencv.js token detection & calibration, contour extraction,
  clipper offset, replicad Gridfinity bin assembly, three.js preview, STL/STEP/3MF export.
disable-model-invocation: true
argument-hint: "[description de la feature]"
---

# Snapfinity Feature Workflow

Feature request: $ARGUMENTS

Follow EVERY phase below IN ORDER. Each phase has a GATE — a condition that MUST be met
before proceeding. Do NOT skip gates. Do NOT combine phases.

All conventions live in `CLAUDE.md` and `docs/technical/architecture.md` — read them, do
not duplicate here. For key files and commands, see [reference.md](reference.md).

---

## Phase 1: Understand & Clarify

### 1.1 Read essential documentation, IN ORDER

| Document                            | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `CLAUDE.md`                         | Entry point — conventions, stack, domain concepts  |
| `docs/technical/architecture.md`    | The decided architecture and why                   |
| `docs/technical/algorithm-bench.md` | The Python oracle (vision reference)               |
| `docs/specs-index.md`               | Scan for related specs — a design may already exist |

### 1.2 Deep-dive requirements

**Do not assume. Ask clarifying questions until requirements are crystal clear.**

| Topic         | Questions to ask                                                          |
| ------------- | ------------------------------------------------------------------------- |
| **What**      | Describe the feature in 2–3 sentences. Expected behavior?                  |
| **Why**       | What problem does it solve? Which user benefits?                           |
| **Scope**     | What's included? What's explicitly excluded?                              |
| **Pipeline**  | Which stage(s) does it touch — vision / offset / CAD / preview / export?   |
| **Assets**    | Does it need new baked primitives (foot/lip, pitch, base variant)?         |
| **UI**        | New screen? New control? Change to an existing view?                       |
| **Edge cases**| No token found? Low contrast? Tool larger than N×M? Pitch mismatch?         |

**Continue until you can write a complete spec without assumptions.**

> **GATE 1** (verify ALL):
>
> - [ ] 1.1 Read CLAUDE.md, architecture.md, algorithm-bench.md, specs-index.md
> - [ ] 1.2 Asked clarifying questions and got answers (or requirements already explicit)
> - [ ] 1.3 Searched the codebase for similar/existing patterns

---

## Phase 2: Document the Spec

Every feature MUST be documented in `specs/`. English only.

### 2.1 Create spec folder

```bash
ls specs/ | grep -E '^[0-9]' | tail -1   # find last number
mkdir specs/NNN-<feature-name>            # 3-digit sequential + kebab-case
```

### 2.2 Write spec files

| File              | Content                                                       |
| ----------------- | ------------------------------------------------------------- |
| `spec.md`         | Requirements, acceptance criteria, scope, edge cases          |
| `architecture.md` | Pipeline stage(s) touched, data shapes, asset/CAD changes, files |
| `plan.md`         | Implementation steps, task breakdown, **test plan**           |

If the feature has UI, add `ux-mockups.md` (and an `.html` mockup when useful).

### 2.3 Write the test plan (in `plan.md`) — BEFORE coding

List each module with new/changed logic, and per module: nominal cases, edge cases,
retro-compat. Pure logic (calibration math, sizing `ceil(dim/pitch)`, geometry helpers)
is unit-tested. Vision/CAD that can't be cheaply asserted is validated **against the
Python oracle** and by **manual visual check** — say so explicitly in the plan.

### 2.4 Present summary to user

```
## Résumé de la spécification
**Feature**: [Name]
**Scope**: [In / out]
**Pipeline**: [stages touched]
**Assets**: [new baked primitives, if any]
**UI**: [new/changed screens]
**Tests**: [unit modules + oracle/manual checks]

Veux-tu que j'implémente cette feature ?
```

> **GATE 2** (verify ALL):
>
> - [ ] Spec folder `specs/NNN-name/` exists
> - [ ] `spec.md`, `architecture.md`, `plan.md` written
> - [ ] Test plan written in `plan.md`
> - [ ] Summary presented in the exact format
> - [ ] **User explicitly approved** ("oui", "go")
>
> Do NOT implement without explicit approval.

---

## Phase 3: Branch & Implement

### 3.1 Create feature branch (MANDATORY)

```bash
git checkout master && git pull
git checkout -b feat/<feature-name>
```

Prefixes: `feat/`, `fix/`, `refactor/`, `docs/`. **Never commit to `master`.**

### 3.2 Implement in dependency order

1. **Pure logic / types** — calibration, sizing, geometry helpers (framework-free, testable)
2. **WASM adapters** — opencv.js / clipper / replicad wrappers
3. **Tests** — implement the Phase 2.3 test plan
4. **UI** — controls, preview, wiring
5. **Assets** — if new baked primitives are needed, add the Python bake script under
   `tools/bake/` and commit the generated asset

### 3.3 Rules (see CLAUDE.md / architecture.md)

- Keep pure logic **separate from WASM/DOM** so it stays unit-testable.
- Lazy-load heavy WASM (opencv.js, replicad); never block first paint.
- The photo never leaves the browser — no network calls with user images.
- Gridfinity geometry comes from baked primitives + parametric assembly (no magic numbers).

> **GATE 3** (verify ALL):
>
> - [ ] On a `feat/` branch (verify `git branch --show-current`)
> - [ ] Implementation follows the order
> - [ ] Every test-plan scenario has a corresponding test
> - [ ] Rules respected

---

## Phase 4: Validate (MANDATORY)

**Do NOT commit without passing ALL checks.** (Adapt commands once the toolchain exists —
see reference.md.)

```bash
npm run build      # Vite build — ZERO errors
npm test           # unit tests — ALL pass
npm run lint       # ZERO errors (warnings ok)
```

For vision/CAD: **manual visual verification** on a real photo (e.g. `ciseaux.jpg`) and,
where relevant, comparison to the Python oracle's output.

> **GATE 4** (verify ALL):
>
> - [ ] Build passes, ZERO errors
> - [ ] Unit tests all pass
> - [ ] Lint clean
> - [ ] Manual/oracle visual check done for vision/CAD changes

---

## Phase 5: Documentation & Commit

### 5.1 Update docs & specs

- Update `docs/technical/architecture.md` if the architecture changed.
- Add a row to `docs/specs-index.md`.
- Mark acceptance criteria `[x]` in `spec.md`, tasks `[x]` in `plan.md`.
- Fill `CLAUDE.md` "Build & run" once the first iteration scaffolds the app.

### 5.2 Commit (conventional commits, no Co-Authored-By)

```bash
git add <specific files>
git commit -m "feat(scope): description

What and why."
```

Scopes: `vision`, `calib`, `offset`, `cad`, `preview`, `export`, `ui`, `assets`, `bake`, `core`, `docs`.

### 5.3 Push & PR

```bash
git push -u origin feat/<feature-name>
gh pr create --title "feat: description" --body "Summary + Changes + Test plan"
```

> **GATE 5** (verify ALL):
>
> - [ ] Specs/docs updated, criteria/tasks checked off
> - [ ] Committed on the feature branch (conventional commit)
> - [ ] Pushed, PR created, URL shared with user

---

## Phase 6: Wait for Merge Approval

**CRITICAL: do NOT merge without explicit user confirmation.**

```
PR créée: [URL]. Veux-tu que je merge dans master ?
```

Only after "oui"/"merge":

```bash
gh pr merge <number> --merge --delete-branch
git checkout master && git pull
```

> **GATE 6**: user approved merge · PR merged & branch deleted · back on `master`, pulled.

---

## Gate Summary

| Gate | Condition                | If skipped            |
| ---- | ------------------------ | --------------------- |
| 1    | Requirements clear       | Wrong feature built   |
| 2    | User approved spec       | Wasted implementation |
| 3    | Code on feature branch   | Direct commits to main |
| 4    | Build + tests + lint pass | Broken code merged    |
| 5    | PR created               | No review possible    |
| 6    | User approved merge      | Unauthorized merge    |
