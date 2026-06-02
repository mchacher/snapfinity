export interface TokenCircle {
  centerPx: { x: number; y: number };
  radiusPx: number;
}

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Tight bounding box of the set (non-zero) pixels of a binary mask. Pure (no WASM) —
 * unit-tested. Returns `null` for an empty mask. Kept cv-free so it stays Vitest-testable
 * (importing opencv.js at module load hangs Vitest — the cv cleanup lives in `isolate.ts`).
 */
export function maskBBox(mask: Uint8Array | Uint8ClampedArray, width: number, height: number): BBox | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if (mask[row + x] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
