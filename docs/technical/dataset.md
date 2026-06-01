# Dataset — photo bank for robust segmentation

The single most valuable asset for making Snapfinity work without manual contrast
tweaking. This bank is a **validation corpus**: a varied set of real photos used to
measure whether automatic segmentation extracts a clean object outline across the
conditions where naive thresholding (Otsu) breaks.

It also decides a key architecture fork:

| Approach                        | Idea                                              | "Just works"? |
| ------------------------------- | ------------------------------------------------- | ------------- |
| **ML matting** (primary hypothesis) | a model separates object/background (rembg / U²-Net, ONNX in-browser) | ✅ insensitive to lighting |
| Adaptive CV (baseline)          | local/adaptive threshold + CLAHE instead of global Otsu | better, still fragile on chrome / dark backgrounds |

The first vision spec compares both **on this corpus**. ML matting is the lead candidate
because it removes the "force the contrast" step; the corpus is what validates it.

## What makes a good sample

- The **calibration token** is fully visible and lies **flat** in the frame.
- The whole object is in frame, **not touching** the token.
- Shot roughly **top-down** (perpendicular), object filling a good part of the frame.
- One sample = one raw photo. Real conditions encouraged (don't clean up the scene).

## Diversity matrix (cover the cases where Otsu breaks)

Aim to spread samples across these axes — the hard cases matter most.

| Axis           | Values                                                            |
| -------------- | ---------------------------------------------------------------- |
| **background** | `white_paper` · `cutting_mat` · `wood` · `light_table` · `dark` · `cluttered` |
| **lighting**   | `bright` · `dim` · `raking` (hard shadows) · `mixed`              |
| **material**   | `matte` · `glossy` · `chrome` (reflective — hard) · `dark` (on dark bg) · `transparent` · `colorful` |
| **shape**      | `thin` (screwdriver, allen keys) · `bulky` · `perforated` (scissors) · `multipart` |

## Layout

```
dataset/
  manifest.csv     # one row per sample (schema below)
  raw/             # the raw phone photos:  <id>.jpg
  truth/           # ground-truth object mask: <id>.png  (optional until generated)
```

## Manifest schema (`manifest.csv`)

```
id,file,object,background,lighting,material,shape,token,truth,source,notes
```

| Column     | Meaning                                                        |
| ---------- | ------------------------------------------------------------- |
| `id`       | stable short id, kebab-case (e.g. `scissors-darkbg-01`)        |
| `file`     | `raw/<id>.jpg`                                                 |
| `object`   | what it is (scissors, pliers, screwdriver…)                   |
| `background`/`lighting`/`material`/`shape` | values from the matrix         |
| `token`    | `yes` / `no` (should be `yes`)                                 |
| `truth`    | `truth/<id>.png` or empty if not yet labelled                 |
| `source`   | where it came from (e.g. `phone-2026-06`)                     |
| `notes`    | anything notable (glare spot, partial shadow…)               |

## Ground truth

A **binary PNG mask**, same dimensions as the raw photo: **white = the object (tool)**,
black = everything else (background AND token). It encodes the silhouette you used to
obtain by forcing the contrast. Token detection is evaluated separately against the
token's known geometry (see [architecture.md §6](architecture.md)).

Truth masks are produced/verified as the segmentation is built — `truth/` may start empty.

## How to contribute a sample

1. Drop the raw photo in `raw/<id>.jpg`.
2. Add a row in `manifest.csv` with its matrix attributes.
3. (Later) add the verified mask in `truth/<id>.png` and fill the `truth` column.

## Storage

Photos are binary and grow over time. While the bank is small it can live here directly;
once it grows, move it to **Git LFS** or a **separate `snapfinity-dataset` repo** to keep
the app repo lean (it already ships large WASM). Decision recorded when we cross that point.
