/** Image side the u2netp model expects. */
export const SEG_SIZE = 320;

// ImageNet normalisation (the u2net family expects this).
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

/**
 * RGBA pixels of a SEG_SIZE×SEG_SIZE image → a normalised CHW Float32 tensor
 * (`1 × 3 × SEG_SIZE × SEG_SIZE`) for u2netp. Pure (no WASM) — unit-tested.
 */
export function rgbaToTensor(rgba: Uint8Array | Uint8ClampedArray): Float32Array {
  const n = SEG_SIZE * SEG_SIZE;
  const out = new Float32Array(3 * n);
  for (let i = 0; i < n; i += 1) {
    out[i] = (rgba[i * 4] / 255 - MEAN[0]) / STD[0];
    out[n + i] = (rgba[i * 4 + 1] / 255 - MEAN[1]) / STD[1];
    out[2 * n + i] = (rgba[i * 4 + 2] / 255 - MEAN[2]) / STD[2];
  }
  return out;
}

/**
 * u2netp saliency map → binary mask (0 / 255). The map is min-max normalised, then
 * thresholded. Pure (no WASM) — unit-tested.
 */
export function saliencyToMask(saliency: Float32Array, threshold = 0.5): Uint8Array {
  let min = Infinity;
  let max = -Infinity;
  for (const v of saliency) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const mask = new Uint8Array(saliency.length);
  for (let i = 0; i < saliency.length; i += 1) {
    mask[i] = (saliency[i] - min) / range >= threshold ? 255 : 0;
  }
  return mask;
}
