# Hosting & deploy

How to host Snapfinity, and **why** — recorded so the choice doesn't have to be
re-litigated. Snapfinity is a **100 % static site** (see [architecture.md](architecture.md) §2),
so any static host works *in principle*. The real decision is driven by **asset weight**, and
by one hard per-file limit that quietly rules a popular host in or out.

## 1. TL;DR

- **Shipping now:** **GitHub Pages** — 100 MB per-file limit (our biggest file passes easily) and
  the deploy workflow is already wired ([README.md](../../README.md) “Deploy”). The catch is a
  **soft ~100 GB/month bandwidth** cap — fine for a hobby project / a handful of friends, risky
  only if it goes viral on Printables/Reddit. URL is a subpath (`<user>.github.io/snapfinity/`)
  unless a custom domain is attached.
- **Best long-term:** **Cloudflare Pages** — the only free tier with **unlimited bandwidth**,
  which matters because a cold-cache session pulls ~30 MB of WASM/model. It has a hard **25 MiB
  per-file limit**, which *used* to be a blocker — see §3. **Resolved:** the app actually loads the
  **asyncify** ORT build (**22.6 MiB**, under the limit), not the 25.02 MiB jsep build; narrowing
  the copy glob (§6) drops the unused oversized jsep file, so the deploy now contains **no file
  over 25 MiB** and Cloudflare accepts it as-is — no CDN workaround needed.

## 2. What we're deploying

A static bundle. There is **no backend** — the photo never leaves the device. The constraint is
purely **how many MB each visitor downloads**. Cold-cache payload (everything loaded across a full
session; first paint is much lighter — vision and CAD are lazy chunks):

| Asset | Size | When it loads |
| ----- | ---- | ------------- |
| `ort-wasm-simd-threaded.asyncify.wasm` (ONNX WebGPU+WASM runtime) | **22.6 MiB** (23,678,474 B) | first photo |
| `replicad_single.wasm` (OpenCascade CAD kernel) | ~10 MB | Preview tab |
| `analyze-*.js` (vision chunk; opencv.js included) | ~10 MB | first photo |
| `u2netp.onnx` (segmentation model) | ~5.1 MB | first photo |
| app JS (`index-*`, `plan-*`) | ~2.3 MB | first paint |

→ **~30 MB per cold-cache session.** Browser caching makes repeat visits cheap, but the *first*
visit of every new user is heavy. **Bandwidth is the deciding criterion.**

## 3. The 25 MiB Cloudflare limit — measured, not assumed

Cloudflare Pages **refuses any deployment containing a file over 25 MiB** (limit on the file **as
stored**; edge Brotli/gzip doesn't help). `onnxruntime-web` ships four WASM builds, one of which —
`ort-wasm-simd-threaded.jsep.wasm` (26,239,907 B = **25.02 MiB**) — is ~25 KB over. So the question
is: **does the app actually load that file?**

**Measured (don't assume).** We import `onnxruntime-web/webgpu` with `numThreads = 1` and capture
the real `/ort/` requests in a headless browser, on **both** code paths:

| Path | WASM the runtime fetches from `/ort/` | Size |
| ---- | -------------------------------------- | ---- |
| WebGPU available (`webgpu` EP) | `ort-wasm-simd-threaded.asyncify.{wasm,mjs}` | **22.6 MiB** ✅ |
| no WebGPU (Safari/Firefox → `wasm` EP) | `ort-wasm-simd-threaded.asyncify.{wasm,mjs}` | **22.6 MiB** ✅ |

→ The `webgpu` entry's glue is the **asyncify** build for *both* EPs; the **jsep** file is **never
fetched**. The file the app loads (22.6 MiB) is **under** the 25 MiB limit. The only reason a naïve
deploy tripped the limit was the *unused* jsep file being copied in alongside it (§6) — once the
copy glob is narrowed to the asyncify build, `dist/` contains **no file over 25 MiB** and Cloudflare
accepts it **as-is, no CDN workaround**. (Re-measure if `onnxruntime-web` is upgraded — a version
bump can change which build the `webgpu` entry pulls.)

Fallback options, kept on record but **no longer needed**: serve the ORT runtime from jsDelivr
(`ort.env.wasm.wasmPaths` → `cdn.jsdelivr.net/npm/onnxruntime-web@<v>/dist/`) or from Cloudflare R2.
Either would dent the "zero-CDN / fully offline" design ([architecture.md](architecture.md) §9)
without touching privacy (the photo still never leaves the device).

## 4. Host comparison

| Host | Bandwidth (free) | Per-file limit | Largest file (22.6 MiB) | Domain | Notes |
| ---- | ---------------- | -------------- | ----------------------- | ------ | ----- |
| **GitHub Pages** | ~100 GB/mo (soft) | 100 MB | ✅ passes | subpath (or custom) | **Shipping now**; workflow already wired |
| **Cloudflare Pages** | **unlimited** | **25 MiB** | ✅ passes once glob narrowed (§6) | root + free SSL | Best bandwidth; best long-term |
| Netlify | 100 GB/mo | none tight | ✅ | root + SSL | Bandwidth-capped like GH Pages |
| Vercel (Hobby) | 100 GB/mo | — | ✅ | root + SSL | Free tier is **non-commercial only** |

## 5. Recommended paths

**Path A — GitHub Pages (shipping now).**
1. Repo **Settings → Pages → Source → “GitHub Actions”** (one-time).
2. Run the existing **Deploy (GitHub Pages)** workflow — builds with `BASE_PATH=/snapfinity/`.
3. Live at `https://<user>.github.io/snapfinity/`. Migrate to Path B if bandwidth becomes a concern.

**Path B — Cloudflare Pages (best long-term, now unblocked).**
1. Connect the repo in Cloudflare Pages: build `npm run build`, output `dist`, env `BASE_PATH=/`.
2. Root domain, free SSL, unlimited bandwidth, auto-deploy on push. No CDN workaround needed once
   the §6 glob narrowing is in (no file over 25 MiB).

## 6. Deploy-size hygiene (done — spec 031)

`dist/` *was* **~146 MB** because `viteStaticCopy` copied **every** onnxruntime-web WASM variant —
`jsep` (25 MiB), `jspi` (14 MB), plain `simd` (13 MB) alongside the `asyncify` build the app
actually loads. The rest was dead weight that bloated the deploy and the file count — and the
oversized `jsep` file is what tripped Cloudflare's limit.

→ The copy glob in [vite.config.ts](../../vite.config.ts) is now narrowed to the **asyncify** build
the runtime fetches (verified in the Network tab, §3): `dist/` drops to **~75 MB** and no file
exceeds 25 MiB. (Residual: Rollup still emits a second, *unused* ~23 MB copy of the asyncify wasm
under `assets/` from the `webgpu` entry's `import.meta.url` reference — harmless, under the limit,
and superseded at runtime by `wasmPaths` → `/ort/`; dropping it would need a build-time stub and
isn't worth the risk.)

## 7. Config notes

- **Base path** is build-time configurable: `BASE_PATH=/sub/` for a project subpath, default `/`
  for a root domain. Runtime assets resolve via `import.meta.env.BASE_URL`, so a subpath just works.
- **No COOP/COEP headers needed** — inference is single-threaded (`numThreads = 1`), so no
  cross-origin isolation is required ([architecture.md](architecture.md) §9). Any plain static host
  serves it.
