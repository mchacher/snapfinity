# Hosting & deploy

How to host Snapfinity, and **why** — recorded so the choice doesn't have to be
re-litigated. Snapfinity is a **100 % static site** (see [architecture.md](architecture.md) §2),
so any static host works *in principle*. The real decision is driven by **asset weight**, and
by one hard per-file limit that quietly rules a popular host in or out.

## 1. TL;DR

- **Best long-term:** **Cloudflare Pages** — the only free tier with **unlimited bandwidth**,
  which matters because a cold-cache session pulls ~50 MB of WASM/model. **But** it has a hard
  **25 MiB per-file limit**, and our ONNX WebGPU runtime is **25.02 MiB** — 25 KB over. It
  **rejects the deploy as-is** (see §3). Fix: serve that one `.wasm` from a CDN (jsDelivr) or R2.
- **Works today, zero code change:** **GitHub Pages** — 100 MB per-file limit (our 25 MiB file
  passes) and the deploy workflow is already wired ([README.md](../../README.md) “Deploy”). The
  catch is a **soft ~100 GB/month bandwidth** cap — fine for a hobby project, risky if it goes
  viral on Printables/Reddit. URL is a subpath (`<user>.github.io/snapfinity/`) unless a custom
  domain is attached.

## 2. What we're deploying

A static bundle. There is **no backend** — the photo never leaves the device. The constraint is
purely **how many MB each visitor downloads**. Cold-cache payload (everything loaded across a full
session; first paint is much lighter — vision and CAD are lazy chunks):

| Asset | Size | When it loads |
| ----- | ---- | ------------- |
| `ort-wasm-simd-threaded.jsep.wasm` (ONNX WebGPU+WASM runtime) | **25.02 MiB** (26,239,907 B) | first photo |
| `replicad_single.wasm` (OpenCascade CAD kernel) | ~10 MB | Preview tab |
| `analyze-*.js` (vision chunk; opencv.js included) | ~10 MB | first photo |
| `u2netp.onnx` (segmentation model) | ~5.1 MB | first photo |
| app JS (`index-*`, `plan-*`) | ~2.3 MB | first paint |

→ **~50 MB per cold-cache session.** Browser caching makes repeat visits cheap, but the *first*
visit of every new user is heavy. **Bandwidth is the deciding criterion.**

## 3. The constraint that decides it — the 25 MiB blocker

The WASM file the app actually loads for the WebGPU segmentation backend
(`ort.env.wasm.wasmPaths` → `/ort/`, see [seg-runtime.ts](../../src/vision/seg-runtime.ts)) is:

```
ort-wasm-simd-threaded.jsep.wasm = 26,239,907 bytes = 25.02 MiB
Cloudflare Pages hard limit       = 26,214,400 bytes = 25.00 MiB
                                    → OVER by ~25 KB ❌
```

Cloudflare Pages **refuses any deployment containing a file over 25 MiB**, and the limit is on the
file **as stored** — Brotli/gzip is applied in transit at the edge, so compression does **not**
help. We're over by 25 KB on the single most important asset. This is the one fact that flips the
obvious “just use Cloudflare” answer.

Two clean ways around it:

- **Serve the ORT runtime from a CDN.** `onnxruntime-web` is published on npm, so its WASM is on
  jsDelivr: point `ort.env.wasm.wasmPaths` at
  `https://cdn.jsdelivr.net/npm/onnxruntime-web@<version>/dist/` instead of `/ort/`. The big file
  leaves our deploy entirely (`dist/` drops to ~30 MB) and there's no per-file limit to hit.
  **Trade-off:** it dents the “zero CDN / fully offline” design choice
  ([architecture.md](architecture.md) §9) — but **privacy is untouched** (the photo still never
  leaves the device; only the wasm binary comes from a CDN).
- **Host just that file on Cloudflare R2** (10 GB free) behind the same custom domain, and point
  `wasmPaths` there. Keeps it on our own infra; a bit more setup than jsDelivr.

## 4. Host comparison

| Host | Bandwidth (free) | Per-file limit | Our 25 MiB file | Domain | Notes |
| ---- | ---------------- | -------------- | --------------- | ------ | ----- |
| **Cloudflare Pages** | **unlimited** | **25 MiB** | ❌ over by 25 KB | root + free SSL | Best bandwidth; needs the §3 workaround |
| **GitHub Pages** | ~100 GB/mo (soft) | 100 MB | ✅ passes | subpath (or custom) | **Works as-is**; workflow already wired |
| Netlify | 100 GB/mo | none tight | ✅ | root + SSL | Bandwidth-capped like GH Pages |
| Vercel (Hobby) | 100 GB/mo | — | ✅ | root + SSL | Free tier is **non-commercial only** |

## 5. Recommended paths

**Path A — Cloudflare Pages + CDN-hosted ORT (best long-term).**
1. Move the ORT runtime off our deploy: set `wasmPaths` to the jsDelivr URL (§3), or R2.
2. Connect the repo in Cloudflare Pages: build `npm run build`, output `dist`, env `BASE_PATH=/`.
3. Root domain, free SSL, unlimited bandwidth, auto-deploy on push.

**Path B — GitHub Pages (ship tonight, no code change).**
1. Repo **Settings → Pages → Source → “GitHub Actions”** (one-time).
2. Run the existing **Deploy (GitHub Pages)** workflow — builds with `BASE_PATH=/snapfinity/`.
3. Live at `https://<user>.github.io/snapfinity/`. Migrate to Path A if bandwidth becomes a concern.

## 6. Deploy-size hygiene (do this regardless of host)

`dist/` is currently **~146 MB** because `viteStaticCopy` copies **every** onnxruntime-web WASM
variant — `asyncify` (23 MB), `jspi` (14 MB), plain `simd` (13 MB), and a duplicated copy under
`assets/` — but the app (plain `onnxruntime-web` import, WebGPU+WASM, `numThreads = 1`) only fetches
the **`jsep`** build. The rest is dead weight that bloats the deploy and the file count.

→ Narrow the copy glob in [vite.config.ts](../../vite.config.ts) to only the variants actually
fetched (confirm in the browser Network tab — at minimum `*jsep*.wasm` + the needed `.mjs`). That
roughly **thirds** `dist/`. It does **not** fix the 25 MiB blocker (the kept `jsep` file *is* the
oversized one) — that still needs the §3 workaround for Cloudflare.

## 7. Config notes

- **Base path** is build-time configurable: `BASE_PATH=/sub/` for a project subpath, default `/`
  for a root domain. Runtime assets resolve via `import.meta.env.BASE_URL`, so a subpath just works.
- **No COOP/COEP headers needed** — inference is single-threaded (`numThreads = 1`), so no
  cross-origin isolation is required ([architecture.md](architecture.md) §9). Any plain static host
  serves it.
