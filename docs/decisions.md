# Decisions

Durable record of product/architecture decisions (ADR-lite). Newest first.

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
