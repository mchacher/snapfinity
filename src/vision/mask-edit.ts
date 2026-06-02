/** Edit-layer values: 0 = neutral (use the auto mask), 1 = force-on (add), 2 = force-off (erase). */
export const EDIT_NEUTRAL = 0;
export const EDIT_ADD = 1;
export const EDIT_ERASE = 2;

/**
 * Stamp a filled disc of `value` into a w×h edit layer (mutates it). Pixels outside the disc
 * (and outside the image) are untouched. Pure — unit-tested.
 */
export function paintDisc(
  layer: Uint8Array,
  w: number,
  h: number,
  cx: number,
  cy: number,
  radius: number,
  value: number,
): void {
  const r = Math.max(0, radius);
  const r2 = r * r;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(h - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y += 1) {
    const dy = y - cy;
    for (let x = x0; x <= x1; x += 1) {
      const dx = x - cx;
      if (dx * dx + dy * dy <= r2) layer[y * w + x] = value;
    }
  }
}

/**
 * Composite the user edit layer over the auto mask → an effective binary mask (0 / 255):
 * force-on wins, then force-off, else the base. Pure — unit-tested.
 */
export function compositeMask(base: Uint8Array, edit: Uint8Array): Uint8Array {
  const out = new Uint8Array(base.length);
  for (let i = 0; i < base.length; i += 1) {
    const e = edit[i];
    out[i] = e === EDIT_ADD ? 255 : e === EDIT_ERASE ? 0 : base[i];
  }
  return out;
}
