# Plan 032 — launch 1.0

1. **Landing** — `src/features/landing/Landing.tsx` (hero · 3 steps · token band · privacy ·
   footer), reusing `Logo`/`Button`/tokens/lucide. Add the `landing` i18n namespace to `en.ts` +
   `fr.ts`.
2. **Wire** — `App.tsx`: `localStorage`-backed `started` flag, `<Landing>` ↔ `<Workspace>`.
3. **Tests** — update `App.test.tsx` for landing-first (landing on first visit; workspace after
   `Commencer`; `localStorage.clear()` between cases).
4. **Version + changelog** — `package.json` → `1.0.0`; add `CHANGELOG.md` (`[1.0.0]` +
   `[Unreleased]`); add `.github/workflows/changelog.yml` (require a CHANGELOG edit per PR,
   `skip-changelog` escape); document the rule in `CLAUDE.md`.
5. **Validate** — `typecheck` / `lint` / `build`; full `vitest run` green (no hang); headless
   screenshot of the landing (FR + EN) and confirm `Commencer` → workspace + token links resolve.
6. **Ship** — branch `feat/launch-1.0`, index row 032, PR (which itself satisfies the new
   changelog gate), merge after CI.

> Post-merge ops (not this PR): enable GitHub Pages + run the deploy workflow; set branch
> protection to require `CI` + `Changelog`; cut the **v1.0.0** GitHub Release (notes from the
> changelog, token STL attached).
