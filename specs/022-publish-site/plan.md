# Plan — 022 site publication

## Steps

1. [ ] `vite.config.ts` — `base: process.env.BASE_PATH || '/'`.
2. [ ] `.github/workflows/deploy.yml` — manual (`workflow_dispatch`) GitHub Pages deploy,
   build with `BASE_PATH=/snapfinity/`, upload artifact, `deploy-pages`.
3. [ ] `README.md` — Deploy section (GitHub Pages + Cloudflare Pages + COOP/COEP note).
4. [ ] `docs/specs-index.md` row 022.

## Test plan

| Check | How | Type |
| ----- | --- | ---- |
| subpath build | `BASE_PATH=/snapfinity/ npm run build` → `dist/index.html` contains `/snapfinity/assets/` | scripted verify |
| default build | `npm run build` → `dist/index.html` contains `/assets/` (root) | scripted verify |
| workflow valid | YAML parses; `workflow_dispatch` only; permissions present | review |
| no app regression | `npm test` / `lint` / `typecheck` | unit |

**Why no unit tests.** This is build/CI config — there is no app logic to unit-test. It's
validated by the two build invocations above (base-path rewrite) + the unchanged test suite.

## Validation (Gate 4)

```
npm run build                       # default (root) — clean
BASE_PATH=/snapfinity/ npm run build  # subpath — asset URLs prefixed
npm test / lint / typecheck         # unaffected
```
