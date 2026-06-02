# Plan — 011 segmentation

## Steps (done)

1. Choose u2netp (Apache, ~4.6 MB) per the size/quality decision; download to `public/models/`.
2. `segment.ts` pure pre/post (`rgbaToTensor`, `saliencyToMask`) + Vitest tests.
3. `segment-verify.ts` (onnxruntime-node): resize → infer → mask → exclude token → overlay.
4. Run on samples; review overlays.

## Task breakdown

- [x] u2netp model bundled
- [x] pure pre/post functions + Vitest tests (3)
- [x] verify:seg (inference + token exclusion + overlays)
- [x] clean tool masks confirmed (scissors / wrench / mouse)
- [x] typecheck / lint / vitest / build green (onnx not bundled)
- [ ] user OK on masks → PR merged

## Validation

| Check | Result |
| ----- | ------ |
| Vitest | 46 pass (incl. `rgbaToTensor`, `saliencyToMask`) |
| `npm run verify:seg` | clean tool masks; token excluded via it-10 circle |
| overlays (manual) | scissors (handle holes kept), wrench, mouse — crisp; **user to confirm** |

**Next:** browser onnxruntime-web wiring + mask→contour→offset→pocket (e2e), and promote good
masks to `dataset/truth/`.
