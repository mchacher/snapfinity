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
 * Brightness/contrast adjustment of RGBA pixels (alpha untouched). Pure, unit-tested. Applied
 * to the segmentation input (and the displayed photo) *before* u2netp, to wash faint shadows
 * on a light background toward white so the model stops segmenting them. `brightness` is an
 * additive offset; `contrast` uses the classic factor formula. (0, 0) is the identity.
 */
export function adjustRgba(
  rgba: Uint8Array | Uint8ClampedArray,
  brightness: number,
  contrast: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length);
  if (brightness === 0 && contrast === 0) {
    out.set(rgba);
    return out;
  }
  const f = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < rgba.length; i += 4) {
    out[i] = f * (rgba[i] - 128) + 128 + brightness;
    out[i + 1] = f * (rgba[i + 1] - 128) + 128 + brightness;
    out[i + 2] = f * (rgba[i + 2] - 128) + 128 + brightness;
    out[i + 3] = rgba[i + 3];
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
