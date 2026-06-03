import { beforeAll, describe, expect, it } from 'vitest';
import { initOpenCascadeForNode } from './oc-node';
import { makeBin } from './bin';
import { cutGripNotches } from './notches';

beforeAll(async () => {
  await initOpenCascadeForNode();
}, 60_000);

function bboxOf(shape: { boundingBox: { bounds: [number[], number[]] } }) {
  const [min, max] = shape.boundingBox.bounds;
  return { w: max[0] - min[0], d: max[1] - min[1], h: max[2] - min[2] };
}

const params = { cols: 2, rows: 4, heightUnits: 3 }; // a long bin → scoops on the two long walls
const notch = (over: Partial<{ enabled: boolean; radiusMm: number; positionMm: number }> = {}) => ({
  enabled: true,
  radiusMm: 9,
  positionMm: 0,
  ...over,
});

describe('cutGripNotches', () => {
  it('preserves the outer bounding box (opposing scoops stay within the envelope)', () => {
    const plain = bboxOf(makeBin(params));
    const notched = bboxOf(cutGripNotches(makeBin(params), params, notch()));
    expect(notched.w).toBeCloseTo(plain.w, 1);
    expect(notched.d).toBeCloseTo(plain.d, 1);
    expect(notched.h).toBeCloseTo(plain.h, 1);
  });

  it('still meshes into a non-empty STL', async () => {
    const notched = cutGripNotches(makeBin(params), params, notch());
    const bytes = (await notched.blobSTL().arrayBuffer()).byteLength;
    expect(bytes).toBeGreaterThan(1000);
  });

  it('is a no-op when disabled', () => {
    const bin = makeBin(params);
    expect(cutGripNotches(bin, params, notch({ enabled: false }))).toBe(bin);
  });

  it('moving the pinch position produces a different (still valid) shape', async () => {
    const centred = await cutGripNotches(makeBin(params), params, notch()).blobSTL().arrayBuffer();
    const moved = await cutGripNotches(makeBin(params), params, notch({ positionMm: 25 })).blobSTL().arrayBuffer();
    expect(moved.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(new Uint8Array(moved)).equals(Buffer.from(new Uint8Array(centred)))).toBe(false);
    // outer envelope is still preserved at an offset position
    const plain = bboxOf(makeBin(params));
    const off = bboxOf(cutGripNotches(makeBin(params), params, notch({ positionMm: 25 })));
    expect(off.w).toBeCloseTo(plain.w, 1);
    expect(off.d).toBeCloseTo(plain.d, 1);
  });
});
