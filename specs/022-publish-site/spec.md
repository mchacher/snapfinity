# Spec 022 — site publication (host-agnostic)

## Overview

Backlog feature #5. Make Snapfinity **publishable as a static site** so people can use it.
The host is **not yet decided** (GitHub Pages vs Cloudflare Pages), so this spec does the
**host-agnostic groundwork** + a ready-to-run GitHub Pages deploy that publishes **only on
manual trigger** (nothing auto-publishes until you opt in).

## Goals

- The production build works under **any base path** (root `/` or a project subpath like
  `/snapfinity/`) via an env var — so either host works unchanged.
- A **manual** GitHub Pages deploy workflow, ready to run.
- Clear **deploy docs** for both GitHub Pages and Cloudflare Pages.

## Non-goals

- Choosing the final host (deferred). 
- A custom domain, analytics, or SEO work.
- Auto-deploy on every push (kept manual until the host is chosen).

## Requirements

- **Configurable base** — `vite.config` reads `base` from `process.env.BASE_PATH` (default
  `/`). All runtime assets already resolve via `import.meta.env.BASE_URL` (model, ort wasm,
  token-ref), so a subpath just works.
- **Deploy workflow** — `.github/workflows/deploy.yml`: build with `BASE_PATH=/snapfinity/`,
  upload the `dist` artifact, deploy to GitHub Pages. Trigger: **`workflow_dispatch` only**
  (manual). Correct `permissions` (`pages: write`, `id-token: write`) + `github-pages` env.
- **Docs** — README "Deploy" section: GitHub Pages (enable Pages → "GitHub Actions", run the
  workflow) **and** Cloudflare Pages (build `npm run build`, output `dist`, `BASE_PATH=/`).
- No COOP/COEP needed (inference is single-threaded) — note it so a host isn't over-configured.

## Acceptance criteria

- [ ] `BASE_PATH=/snapfinity/ npm run build` emits `dist/index.html` referencing
      `/snapfinity/assets/...`; default build still references `/assets/...`.
- [ ] The deploy workflow is valid YAML, manual-trigger only, with correct permissions.
- [ ] README documents both hosts + the "enable Pages" one-time step.
- [ ] `build`/`lint`/`typecheck`/tests unaffected (no app code change).

## Scope

**In:** `vite.config.ts` (env base), `.github/workflows/deploy.yml`, README "Deploy" section,
spec/docs.

**Out:** picking the host, custom domain, auto-deploy.

## Edge cases

- **Subpath base** — runtime assets use `BASE_URL`, so `/ort/`, `/models/`, `token-ref.jpg`
  resolve under the subpath. (Audited: no other absolute asset paths.)
- **Large WASM (~35 MB)** — fine on both hosts (static, cached); documented.
- **SPA fallback** — Snapfinity is a single screen with no client routes, so no 404 rewrite is
  needed.
