# Plan — 023 token threshold sweep

## Steps

1. [ ] `src/vision/token.ts` — extract `detectAtCut`; `detectToken` sweeps `DARK_CUTS` and keeps
   the lowest-score candidate.
2. [ ] `tools/cv/verify.ts` — filter `.jpe?g` so the new fixture is included.
3. [ ] Commit `dataset/raw/scissors-token-shadow.jpeg` as a fixture.
4. [ ] `docs/specs-index.md` row 023.

## Test plan

| Check | How | Type |
| ----- | --- | ---- |
| shadow photo improves | `verify:vision`: `scissors-token-shadow` score ~0.31 → < ~0.1 | oracle |
| no regression | `verify:vision`: still 37/37, scales plausible | oracle |
| compiles | `typecheck` / `lint` / `build` | unit |

**Why no vitest unit test.** `token.ts` imports opencv.js, which **can't init under vitest**
(WASM) — the project validates vision via the `verify:vision` tsx oracle on the dataset (see
the note at the top of `tools/cv/verify.ts` and spec 010). That oracle is the test here.

## Validation (Gate 4)

```
npm run verify:vision   # 37/37, shadow photo score collapses
npm run build / lint / typecheck
```
