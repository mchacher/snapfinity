# Architecture 032 — launch 1.0

## Landing as an in-app view (no router)

The app is a single static SPA; adding a router for one extra screen isn't worth it. Instead
`App.tsx` holds a tiny boolean:

```
started = localStorage['snapfinity.seenLanding'] === '1'
<I18nProvider>{started ? <Workspace/> : <Landing onStart={start}/>}</I18nProvider>
```

`start()` writes the flag and flips state. The `localStorage` reads/writes are wrapped in
try/catch so private-mode / disabled-storage just shows the landing again next time (no crash).
The landing lives **inside** `I18nProvider`, so its FR/EN toggle shares the same context the
workspace uses — switching language on the landing carries into the app.

The landing is `h-full overflow-y-auto` (the root `#app` is `height: 100%`), so it scrolls
internally exactly like the workspace and the viewer.

## Landing composition

Pure presentational component, no new deps — reuses `ui/Logo`, `ui/Button`, the Tailwind
`@theme` accent/slate tokens, and `lucide-react` icons already in the bundle. Token download links
are plain `<a download href={`${import.meta.env.BASE_URL}token/snapfinity-token.stl`}>` so they
resolve correctly under a project subpath (`/snapfinity/`). A small inline `TokenGlyph` SVG (disc +
6-fold ring of holes) echoes the real token. The hero backdrop is a CSS grid pattern
(`42px` cells = a Gridfinity unit) masked to fade at the edges.

## Test impact

`App.test.tsx` rendered `<App/>` and asserted the workspace — now `<App/>` shows the landing
first. Updated to two cases: (1) landing on first visit (FR title + `Commencer`); (2) click
`Commencer` → workspace (`Calibrage`, `Aperçu 3D`). `localStorage.clear()` in `afterEach` keeps the
two independent. The workspace still renders under happy-dom (R3F `Canvas` no-ops without WebGL),
as it did before — so no hang risk reintroduced.

## Release process

- **CHANGELOG.md** — Keep a Changelog + SemVer. `[1.0.0]` curates the whole app (first release);
  `[Unreleased]` accumulates future entries. Compare/tag links at the bottom.
- **changelog.yml** — runs on every `pull_request` (incl. `labeled`/`unlabeled` so toggling the
  label re-runs it). The job **always runs** and reads the `skip-changelog` label from the event
  payload *inside* a step (not via a job-level `if:`) — a job skipped by `if:` reports "skipped",
  which leaves a *required* check stuck pending; an always-running job that `exit 0`s on the label
  reports success. It diffs `origin/<base>...HEAD` for `CHANGELOG.md`.
- Making it **required**: branch protection on `master` lists the `CI` and `Changelog` checks as
  required (set post-merge, once the workflow exists on `master`).
