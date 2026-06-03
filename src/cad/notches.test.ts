import { beforeAll, describe, expect, it } from 'vitest';
import { initOpenCascadeForNode } from './oc-node';
import { makeBinWithPocket } from './pocket';
import { cutGripNotches } from './notches';
import type { Point2D } from '../core/offset';

beforeAll(async () => {
  await initOpenCascadeForNode();
}, 60_000);

function bboxOf(shape: { boundingBox: { bounds: [number[], number[]] } }) {
  const [min, max] = shape.boundingBox.bounds;
  return { w: max[0] - min[0], d: max[1] - min[1], h: max[2] - min[2] };
}

const params = { cols: 2, rows: 4, heightUnits: 3 };
// a centred 40×80 mm object footprint (mm) — the grips default to its ±X edge
const object: Point2D[] = [
  [-20, -40],
  [20, -40],
  [20, 40],
  [-20, 40],
];
const ctx = { footprint: object, depthMm: 18 };
const bin = () => makeBinWithPocket(params, object, { depthMm: 18 }); // solid pocketed bin (real case)
const notch = (over: Partial<{ enabled: boolean; radiusMm: number; offsetXMm: number; offsetYMm: number }> = {}) => ({
  enabled: true,
  radiusMm: 9,
  offsetXMm: 0,
  offsetYMm: 0,
  ...over,
});

describe('cutGripNotches', () => {
  it('preserves the outer bounding box (vertical scoops stay within the envelope)', () => {
    const plain = bboxOf(bin());
    const notched = bboxOf(cutGripNotches(bin(), params, notch(), ctx));
    expect(notched.w).toBeCloseTo(plain.w, 1);
    expect(notched.d).toBeCloseTo(plain.d, 1);
    expect(notched.h).toBeCloseTo(plain.h, 1);
  });

  it('actually removes material (a finger channel) + still meshes', async () => {
    const plain = bin().mesh({ tolerance: 0.1 }).triangles.length;
    const notched = cutGripNotches(bin(), params, notch(), ctx);
    expect(notched.mesh({ tolerance: 0.1 }).triangles.length).not.toBe(plain);
    expect((await notched.blobSTL().arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });

  it('is a no-op when disabled', () => {
    const b = bin();
    expect(cutGripNotches(b, params, notch({ enabled: false }), ctx)).toBe(b);
  });

  it('the X/Y offset moves the pair (different, still valid shape)', async () => {
    const base = await cutGripNotches(bin(), params, notch(), ctx).blobSTL().arrayBuffer();
    const moved = await cutGripNotches(bin(), params, notch({ offsetXMm: 10, offsetYMm: 25 }), ctx)
      .blobSTL()
      .arrayBuffer();
    expect(moved.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(new Uint8Array(moved)).equals(Buffer.from(new Uint8Array(base)))).toBe(false);
  });

  it('falls back to a bin-based default when there is no footprint', () => {
    const notched = cutGripNotches(bin(), params, notch(), { footprint: null, depthMm: 18 });
    const plain = bboxOf(bin());
    const b = bboxOf(notched);
    expect(b.w).toBeCloseTo(plain.w, 1);
    expect(b.d).toBeCloseTo(plain.d, 1);
  });
});
