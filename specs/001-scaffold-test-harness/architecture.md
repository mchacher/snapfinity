# Architecture — 001 scaffold & test harness

## Pipeline stage(s) touched

None (foundation). This establishes the structure every pipeline stage plugs into.

## Tooling

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Build          | **Vite 5** (vanilla-ts template — no UI framework) |
| Language       | **TypeScript**, `strict: true`                    |
| Tests          | **Vitest**                                        |
| Lint / format  | **ESLint** (flat config) + `typescript-eslint` + **Prettier** |
| CI             | **GitHub Actions**, Node 20, `npm ci`             |
| Package manager| **npm**                                           |

## Directory convention

```
Snapfinity/                      (repo root = the web app)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts               # build + Vitest config
├── eslint.config.js
├── .prettierrc
├── src/
│   ├── main.ts                  # app entry (placeholder until it 4)
│   └── core/                    # PURE logic: no WASM, no DOM → unit-tested
│       ├── sanity.ts            # harness placeholder (removed in it 1)
│       └── sanity.test.ts
├── .github/workflows/ci.yml
└── docs/  specs/  dataset/  .claude/   (existing)
```

**Added later** (not in it 0): `src/adapters/` for WASM wrappers (opencv.js, replicad,
three.js, clipper) with deterministic I/O; `src/ui/` for the interface (it 4). The rule:
domain logic stays in `core/` (framework-free, fully unit-tested); anything touching WASM
or the DOM is a thin adapter around it.

## Files added

- `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `.prettierignore`
- `index.html`, `src/main.ts`
- `src/core/sanity.ts`, `src/core/sanity.test.ts`
- `.github/workflows/ci.yml`

## CI

`ci.yml`: on `push` and `pull_request` → `npm ci` → `npm run typecheck` → `npm run lint`
→ `npm test` → `npm run build`. Fail fast; single job on Node 20 (ubuntu-latest).

## Risks

Minimal. Main risk is config drift (ESLint flat config / tsc / Vitest interplay) — mitigated
by keeping each config minimal and standard.
