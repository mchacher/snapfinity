# Overnight log & morning questions

Autonomous overnight session (2026-06-01 → 02). Latitude: **maximum**, **auto-merge** on
green CI, **tests on everything**, **UI = design system first** (clean, CAD-suited).
This file is the morning briefing — read the **Questions** section first. (Transient; delete
once consumed.)

## Done tonight

| It | Title | Status |
| -- | ----- | ------ |
| 4 | Real Gridfinity foot + stacking lip, parametric pitch 20–84 mm, no magnets | ✅ merged (PR #4) |

(Earlier today: it 0 scaffold, it 1 calibration/sizing, it 2 CAD spike — all merged.)

## Decisions I took autonomously (veto in the morning)

- **Foot/lip = adapted from replicad's official Gridfinity example** (MIT, credited in `bin.ts`),
  rather than reimplementing — it's our exact stack and proven.
- **Pitch range 20–84 mm** (continuous, validated). Below ~20 the foot tapers overlap.
- **Stacking lip default ON**, parametric (`includeLip`).
- **Sample generator** = `tools/cad/sample.ts` run via `tsx` (imports the real model — no
  duplication), replacing the throwaway `.mjs`.
- **TOP_RISE = 3.63 mm** measured constant for the top profile (pitch/lip-independent).

## ⚠️ Questions for you (each has my default — just confirm or redirect)

1. **Foot fit on real baseplates** *(most important)*. The replicad socket is **5.0 mm** tall
   (big taper 2.4) vs the **standard 4.75 mm** (2.15). Your existing baseplates are presumably
   standard. → *Default plan:* I add a profile option and you **print-test a 1×1** and tell me
   if it seats. Do you want me to switch to the exact-spec 4.75 profile now, or keep replicad's
   and fit-test first?
2. **Mesh resolution / STL size.** A 2×1 bin exports ~17 MB (fine detail). → *Default:* I'll add
   a mesh tolerance so STLs are printer- and web-friendly (~hundreds of KB). OK?
3. **Pocket depth (it 3).** A photo gives the 2-D footprint but **not the object's thickness**.
   → *Default:* pocket = full usable depth (down to a thin floor), with an optional manual depth.
   Or do you want a fixed/limited pocket depth?
4. **UI design system (it 4)** — I'll start it tonight (build only; you eyeball in the morning):
   - Theme: **light, clean, single accent** (default) — or dark / auto?
   - UI language: **FR + EN toggle** (default) — or one only?
   - Accent colour preference? (default: a calm blue-teal)
5. **Token OD.** Use the **nominal 76.2 mm** (default) or do you have a **caliper-measured** OD
   of your printed token for better calibration?
6. **Segmentation model (it 7).** Start with **U²-Net / RMBG** matting via onnxruntime-web.
   The model is a downloaded `.onnx` (a few MB–tens of MB). → *Default:* fetch from a CDN at
   runtime (keeps the repo light). OK, or embed it in the repo?
7. **Ground-truth masks.** `dataset/truth/` is empty. → *Default:* tonight I generate ML masks
   on your 10 photos; you **eyeball them** in the morning and we promote the good ones to truth/.
8. **Hosting.** Set up **GitHub Pages** deploy now, or later? (default: later, once there's a UI).
9. **Offset default.** Printing-clearance offset default **1.0 mm** (the oracle's value), exposed
   in the UI. OK?

## What I'm NOT deciding without you

Anything above marked with a real fork. I'll build toward sensible defaults and flag each
spot; nothing is hard to revert (clean squash history).
