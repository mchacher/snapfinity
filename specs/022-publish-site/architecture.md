# Architecture — 022 site publication

## What changes

Infra + config only — **no application code**.

### Base path

`vite.config.ts`:

```
base: process.env.BASE_PATH || '/'
```

Vite prefixes built asset URLs (and rewrites `index.html`'s `/src/main.tsx`) with `base`.
Runtime-fetched assets already use `import.meta.env.BASE_URL`:

- `seg-runtime.ts` → `${BASE_URL}ort/`, `${BASE_URL}models/u2netp.onnx`
- `analyze.ts` → `${BASE_URL}token-ref.jpg`

So a subpath deploy needs no app change. (Audited: no other absolute asset references.)

### Deploy workflow (`.github/workflows/deploy.yml`)

Manual (`workflow_dispatch`) only:

```
permissions: { contents: read, pages: write, id-token: write }
job build:  checkout → setup-node → npm ci → BASE_PATH=/snapfinity/ npm run build
            → actions/upload-pages-artifact (dist)
job deploy: environment github-pages → actions/deploy-pages
```

Manual trigger means nothing publishes until the user runs it (host still undecided). The
existing `ci.yml` (typecheck/lint/test/build) is untouched.

### Docs

README gains a **Deploy** section:

- **GitHub Pages** — Settings → Pages → Source "GitHub Actions" (one-time), then run the
  *Deploy* workflow. Base = `/snapfinity/`.
- **Cloudflare Pages** — connect the repo, build `npm run build`, output `dist`, `BASE_PATH=/`
  (root domain).
- Note: no COOP/COEP needed (`numThreads = 1`).

## Files

| File | Change |
| ---- | ------ |
| `vite.config.ts` | `base: process.env.BASE_PATH || '/'` |
| `.github/workflows/deploy.yml` | **new** — manual GitHub Pages deploy |
| `README.md` | **+** Deploy section |

## Risks

- Wrong base → broken asset URLs. Mitigated: verified `BASE_PATH=/snapfinity/ npm run build`
  rewrites `dist/index.html` to `/snapfinity/assets/...`.
- Auto-publishing prematurely → avoided by `workflow_dispatch`-only.
