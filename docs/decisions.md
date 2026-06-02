# Decisions

Durable record of product/architecture decisions (ADR-lite). Newest first.

## 2026-06-02 — Image pre-process (brightness/contrast)

| # | Topic | Decision |
| - | ----- | -------- |
| 17 | **Confidently-segmented shadows** | The threshold only drops *low-confidence* shadows; a cast shadow the model confidently includes (e.g. the cutter's right side) needs attacking **upstream**. Add **Luminosité + Contraste** sliders applied to the image **before u2netp** — washing light shadows on a white background toward white so the model stops segmenting them. Verified on the cutter. It changes the model input, so it **re-runs the inference** (debounced ~450 ms), unlike the live threshold. Pixel maths is the pure `adjustRgba`. **Memory:** the model input (320²) is adjusted in `analyze`; the *displayed* photo is adjusted in the overlay at canvas resolution (never the full-res buffer). A module-level **decode cache** keyed by file means a brightness change re-runs only adjust + inference, not the full-res decode — fixing a renderer crash from tripled peak memory. |

## 2026-06-02 — Detection threshold (shadow control)

| # | Topic | Decision |
| - | ----- | -------- |
| 16 | **Shadows in the mask** | Shadows get included because u2netp's saliency is binarised at a fixed cut. Fix: expose a **detection-threshold slider** (`detectThreshold`, 0.3–0.8, default 0.5) — raising it keeps only high-confidence foreground, dropping soft shadows. The mask + contour are **re-derived live from the stored saliency** (`deriveMask` — re-threshold + cv upscale/clean/contour, **no u2netp re-inference**), debounced. Trade-off: too high also drops low-contrast real parts, so it's a user knob. The mask brush (014) handles the residual cases. |

## 2026-06-02 — Global layout (mockup A)

| # | Topic | Decision |
| - | ----- | -------- |
| 15 | **View switch in the header** | The Détourage / Aperçu 3D switch is a **segmented control in the header** (centred), not a tab bar above the right panel — it governs both panels, and it fills the otherwise-empty header centre. Chosen from 3 HTML mockups (see `mockups/`). The Détourage right side is a **full-bleed canvas** with a floating bar (status pills + "change photo"); the left panel stays contextual (decisions #14). Mockups rendered + reviewed with Playwright (kept as a dev-only screenshot tool). |

## 2026-06-02 — Détourage iteration scope

| # | Topic | Decision |
| - | ----- | -------- |
| 13 | **Interior holes** | The contour is the **outer outline only** for now (`RETR_EXTERNAL`, largest area); interior holes (scissors/wrench rings) are **filled** in the pocket. Simpler + robust to false holes from segmentation; islands/pillars come later. |
| 14 | **Détourage split + controls** | Split the work: **013** = contour + smoothing slider + clearance slider + live 2D overlay; **014** = mask **brush** (paint/erase). The **left panel is tab-contextual** (done in 013): Outline tab → contour tools (smoothing, clearance, token Ø); 3D tab → bin params (size, height, thickness, lip). The Outline tab's right side stays a clean photo + overlay. |

## 2026-06-02 — Vision quality scope + live contour adjustment

| # | Topic | Decision |
| - | ----- | -------- |
| 10 | **Token threshold** | Token detection uses a **fixed dark cut** (`THRESH_BINARY_INV @ 100`), not global Otsu. The token is near-black on any background; Otsu leaked wood grain into the contour and loosened the circle. Worst case (pen-wood) matchShapes 0.607 → 0.358; still 36/36 detected; white unaffected. |
| 11 | **Background scope** | **Optimise for a white/light background** — the supported, recommended scenario (clean masks + tight token circle). Wood/textured backgrounds are knowingly degraded (u2netp saliency limit); not a target for now. Surface "plain light background" as user guidance in the UI. |
| 12 | **Contour adjustment** | The mask→contour step must expose **live, visually-adjusted sliders**: a **smoothing/tolerance** control (less pixelation, rounder corners — chaikin/spline or mask blur+approxPolyDP) plus the existing **clearance** offset. The user adjusts and the contour overlay on the photo updates **in real time**, before any 3D pocket is generated. Belongs to the contour-extraction iteration (next). |

## 2026-06-02 — Q&A batch (unblocks UI + vision)

| # | Topic | Decision |
| - | ----- | -------- |
| 1 | **Foot profile** | Use the **exact Gridfinity spec: 4.75 mm** foot (big taper 2.15, not replicad's 2.4 → 5.0). Best standard-baseplate compatibility; confirm with a print test. |
| 2 | **STL mesh** | **Balanced tolerance ~0.05 mm** — light files (hundreds of KB), smooth to the eye/print. |
| 3 | **Pocket depth** | **Manual tool-thickness input in the UI** sets the pocket depth; **bin height** (×7 mm) is a separate parameter. |
| 4 | **UI** | **React**; **light, clean** theme; **calm blue-teal** accent; **FR + EN** now, with an **extensible i18n** setup for more languages later. Design system first. |
| 5 | **Token OD** | Calibration **setting, default 76.2 mm**, user-adjustable (measure printed token for precision). |
| 6 | **Segmentation model** | **U²-Net (full), Apache-2.0** — RMBG excluded (non-commercial, incompatible with GPL). Model **self-hosted** with the site (offline after first load). |
| 7 | **Ground-truth masks** | **Bootstrap**: model generates masks → user validates → promote good ones to `dataset/truth/`. |
| 8 | **Hosting** | **Later (it 4)** — wire GitHub Pages once there's a real UI. |
| 9 | **Offset (clearance)** | **Adjustable in UI, default 1.0 mm** (oracle's value; forgiving of contour error). |

These supersede the open questions in `overnight-log.md`.
