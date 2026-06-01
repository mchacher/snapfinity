# Overnight log & morning questions

Autonomous session (2026-06-01 → 02). Latitude **maximum**, **auto-merge** on green CI,
**tests on everything**, **UI = design system first**. Read **Questions** first. (Transient —
delete once consumed.)

## ✅ Done tonight (all merged to master, CI green)

| It | Title | PR |
| -- | ----- | -- |
| 4 | Real Gridfinity foot + stacking lip, parametric pitch **20–84 mm**, no magnets | #4 |
| 5 | Polygon **clearance offset** (clipper-lib), pure `core/` | #5 |
| 3 | **Tool-shaped pocket** cut into the bin (+ `hollow` option) | #6 |

**Milestone:** the **CAD half of the pipeline is complete** — from a 2-D polygon we now
produce a real Gridfinity bin with a tool-shaped cavity, exportable as STL. 33 tests green.
The remaining half is **vision (photo → polygon)** and the **UI**.

### Notable fixes / findings
- **OC meshing fix:** the `{ optimisation: 'commonFace' }` fuse flag left coincident faces
  that broke tessellation on a solid body → dropped it (plain `.fuse()`). Hollow bin still
  meshes; pocketed bin now exports valid STL.
- **STL size:** detailed foot/lip → large meshes (~17 MB for 2×1). Needs mesh-tolerance
  decimation before web/print (Q2).

## Decisions I took (veto in the morning)
- Foot/lip **adapted from replicad's MIT example** (credited), not reimplemented.
- **Pitch range 20–84 mm**, continuous, validated.
- **Lip default on**, parametric.
- **clipper-lib** for offset (pure JS, like pyclipper); minimal ambient types added.
- **Dropped `commonFace`** on fuses (meshing robustness; slightly heavier meshes — see Q2).
- Sample generator = `tools/cad/sample.ts` via `tsx` (imports the real model, no duplication).

## Why I stopped before UI + vision
I deliberately did **not** build the UI or vision blind. Both need your input that's much
better given with you awake: UI **design preferences** + **visual** verification, and vision
needs the **ML model choice** + **mask validation** against your photos. I finished the
fully-testable CAD pipeline instead. The questions below unblock the rest — answer them and I
go straight into UI (design system first) + vision.

## ⚠️ Questions for you (each has my default — confirm or redirect)

1. **Foot fit on real baseplates** *(most important)*. replicad's socket is **5.0 mm** tall
   vs the **standard 4.75 mm**. → *Default:* print-test a 1×1 and tell me if it seats; if not,
   I switch to the exact-spec 4.75 profile. Want me to switch now, or fit-test first?
2. **Mesh resolution / STL size.** 2×1 ≈ 17 MB. → *Default:* add a mesh tolerance so STLs are
   printer/web-friendly (~hundreds of KB). OK?
3. **Pocket depth.** A photo gives the 2-D shape, not thickness. → *Default:* pocket = full
   usable depth minus a 1 mm floor, with an optional manual depth. OK, or a fixed depth?
4. **UI design system (it 4).** Confirmed: **React**. Remaining prefs:
   - Theme: **light, clean, single accent** (default) — or dark / auto?
   - Accent colour? (default: calm blue-teal)
   - UI language: **FR + EN toggle** (default) — or one only?
5. **Token OD.** Nominal **76.2 mm** (default) or a **caliper-measured** OD of your printed token?
6. **Segmentation model (it 7).** Matting via onnxruntime-web (U²-Net / RMBG). The `.onnx` is a
   few–tens of MB. → *Default:* fetch from a CDN at runtime (repo stays light). Embed instead?
7. **Ground-truth masks.** `dataset/truth/` is empty. → *Default:* I generate ML masks on your
   10 photos; you eyeball them and we promote good ones to truth/. OK?
8. **Hosting.** GitHub Pages now or later? (default: later, once there's a UI).
9. **Offset default.** Printing-clearance default **1.0 mm** (oracle's value), exposed in the UI. OK?

## State of the repo
- Pipeline (synthetic input → STL): `core/calibration` · `core/sizing` · `core/offset` ·
  `cad/bin` (foot+lip, pitch 20–84) · `cad/pocket`. All unit-tested (33 tests).
- Build/CI green. Next branches will start from `master`.
