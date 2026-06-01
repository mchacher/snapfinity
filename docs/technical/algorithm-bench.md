# Algorithm bench (the Python oracle)

The original Python script is **not** part of the Snapfinity product. It is the
**algorithm reference / tuning bench**: the fast environment in which we tune and
validate the computer-vision pipeline on real photos **before/while porting** it to
opencv.js. Treat its output as the oracle the WASM port must reproduce.

## Location

```
~/Documents/00_3D/100_Gridfinity/GridfinityFootprintGenerator/
├── gridfinity_footprint_gen.py   # the pipeline
├── token.jpg                     # token silhouette reference (legacy detection)
├── token 2.0 v4.step             # token CAD — ground-truth geometry
└── *.jpg                         # real tool photos (ciseaux, pince, dymo, …)
```

Keep this folder **intact**. It is referenced, not modified, by Snapfinity.

## What the script does (reference pipeline)

1. **Calibrate** — find the token, measure its diameter in px, derive `mm/px` from the
   known OD (76.2 mm).
2. **Threshold + morphology** — grayscale → Gaussian blur → Otsu inverse → close/open.
3. **Contours** — extract, simplify (`approxPolyDP`), convert px→mm.
4. **Offset** — outward offset via pyclipper (printing clearance).
5. **Export** — DXF + compute required Gridfinity modules `ceil(dim / pitch)`.

The `--module-size` flag (default 42) already parametrizes the pitch.

## Token ground truth (`token 2.0 v4.step`)

| Property        | Value                                  |
| --------------- | -------------------------------------- |
| Outer diameter  | **76.2 mm** (radius 38.1, 6 arcs)       |
| Centering       | concentric to origin                    |
| Thickness       | 2.0 mm                                  |
| Pattern         | 6 blades, **6-fold symmetry**, through-holes |

These facts drive the smarter detection described in
[architecture.md §6](architecture.md). For best calibration accuracy, measure the
**printed** token's OD with a caliper (print shrink ~0.2–0.5 %) rather than trusting the
nominal 76.2 mm.

## Known issues to fix during the port

- `cv2.imshow` is incompatible with `opencv-python-headless` (the pinned dependency) —
  the preview must be optional / saved to a file, not shown via the GUI.
- `RETR_EXTERNAL` discards the token's distinctive through-holes — use `RETR_TREE`.
- `matchShapes` picks the closest contour **with no threshold** — add a confidence gate.
