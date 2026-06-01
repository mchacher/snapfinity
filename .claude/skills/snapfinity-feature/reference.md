# snapfinity-feature — reference

Key files and commands. Update this as the project grows (it is intentionally thin while
at the foundation stage).

## Key locations

| Path                                          | What                                          |
| --------------------------------------------- | --------------------------------------------- |
| `CLAUDE.md`                                   | AI entry point                                |
| `docs/technical/architecture.md`              | Decided architecture + rationale              |
| `docs/technical/algorithm-bench.md`           | The Python oracle (vision reference)          |
| `docs/specs-index.md`                         | Chronological spec index                      |
| `specs/NNN-name/`                             | Per-feature spec / architecture / plan        |
| `assets/` *(TBD)*                             | Baked Gridfinity primitives (foot/lip, pitch) |
| `tools/bake/` *(TBD)*                         | Python scripts that bake assets (cqgridfinity) |
| `src/` *(TBD)*                                | Web app (Vite)                                |

## The oracle (outside this repo, do not modify)

```
~/Documents/00_3D/100_Gridfinity/GridfinityFootprintGenerator/
  gridfinity_footprint_gen.py · token.jpg · token 2.0 v4.step · *.jpg (real photos)
```

## Commands (fill in once the toolchain is scaffolded)

```bash
# Dev / build — TBD (first UI iteration)
npm install
npm run dev
npm run build
npm test
npm run lint

# Bake Gridfinity assets — TBD
# python tools/bake/bake_feet.py --pitch 42
```

## Spec templates

**`spec.md`** — Overview · Goals / Non-goals · Requirements · Acceptance criteria
(checkboxes) · Scope (in/out) · Edge cases.

**`architecture.md`** — Pipeline stage(s) touched · Data shapes (inputs/outputs) ·
Asset/CAD changes · Files added/changed · Risks.

**`plan.md`** — Implementation steps (ordered) · Task breakdown (checkboxes) ·
**Test plan** (modules → scenarios table; note which are unit vs oracle/manual).
