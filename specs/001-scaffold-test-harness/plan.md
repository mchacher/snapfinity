# Plan — 001 scaffold & test harness

## Implementation steps (ordered)

1. `package.json` + dev deps (vite, typescript, vitest, eslint, typescript-eslint, prettier).
2. `tsconfig.json` — strict.
3. `vite.config.ts` (build + Vitest `test` block), `index.html`, `src/main.ts` placeholder.
4. `src/core/sanity.ts` (pure) + `src/core/sanity.test.ts`.
5. `eslint.config.js` (flat) + `.prettierrc` + `.prettierignore`.
6. npm scripts: `dev`, `build`, `test`, `lint`, `typecheck`.
7. `.github/workflows/ci.yml`.
8. Run all four checks locally until green.
9. Create GitHub repo (`gh repo create`), push `feat/scaffold-test-harness`, open PR, confirm CI green.
10. Fill `CLAUDE.md` "Build & run" + tidy README.

## Task breakdown

- [x] package.json + dev deps installed
- [x] tsconfig strict
- [x] vite config + index.html + main.ts
- [x] core/sanity.ts + sanity.test.ts
- [x] vitest wired (`npm test` runs the sample)
- [x] eslint flat + prettier
- [x] scripts: dev/build/test/lint/typecheck
- [x] ci.yml
- [x] all four checks green locally
- [x] GitHub repo + branch + PR + **CI green** (#1, merged)
- [x] CLAUDE.md "Build & run" + README updated

## Test plan

Only one module has logic in it 0; its test's real job is to **prove the harness runs**.

| Module        | Scenario                 | Expected                                      |
| ------------- | ------------------------ | --------------------------------------------- |
| `core/sanity` | sample pure fn, nominal  | returns the expected value (Vitest executes)  |
| `core/sanity` | sample pure fn, edge     | handles a boundary input (proves assertions)  |

**Meta-validation** (CI gates, not unit tests): `typecheck` 0 errors · `lint` 0 errors ·
`build` succeeds · **CI green on the PR**.

> Real domain unit tests begin in **it 1** (calibration & sizing math). It 0's only job is
> to make the harness exist so no later iteration can ship without tests.
