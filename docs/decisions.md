# Decisions

Durable record of product/architecture decisions (ADR-lite). Newest first.

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
