# Plan 033 — landing on every visit + home button

1. `App.tsx` — drop `localStorage`; `started` starts `false`; pass `onHome` to `Workspace`.
2. `Workspace` — accept `onHome?`, pass to `Header`.
3. `Header` — wrap logo + wordmark in a `button` (`onClick={onHome}`, `aria-label={t('header.home')}`).
4. i18n — add `header.home` (en/fr).
5. Tests — `App.test.tsx`: landing on visit; Commencer → workspace; logo → landing.
6. Changelog — `[Unreleased]` entry (mandatory gate).
7. Gate — typecheck / lint / build / full `vitest run`; headless verify the round-trip. Branch
   `feat/landing-always`, index row 033, PR, merge after CI; redeploy Pages.
