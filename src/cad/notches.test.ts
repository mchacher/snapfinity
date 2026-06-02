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

const params = { cols: 2, rows: 1, heightUnits: 3 };

describe('cutGripNotches', () => {
  it('preserves the outer bounding box (scoops are within the envelope)', () => {
    const plain = bboxOf(makeBin(params));
    const notched = bboxOf(cutGripNotches(makeBin(params), params, { enabled: true, radiusMm: 9 }));
    expect(notched.w).toBeCloseTo(plain.w, 1);
    expect(notched.d).toBeCloseTo(plain.d, 1);
    expect(notched.h).toBeCloseTo(plain.h, 1);
  });

  it('still meshes into a non-empty STL', async () => {
    const notched = cutGripNotches(makeBin(params), params, { enabled: true, radiusMm: 9 });
    const bytes = (await notched.blobSTL().arrayBuffer()).byteLength;
    expect(bytes).toBeGreaterThan(1000);
  });

  it('is a no-op when disabled', () => {
    const bin = makeBin(params);
    expect(cutGripNotches(bin, params, { enabled: false, radiusMm: 9 })).toBe(bin);
  });

  it('skips (returns the bin unchanged) when the wall is too short for two scoops', () => {
    const narrow = { cols: 1, rows: 1, heightUnits: 3 };
    const bin = makeBin(narrow);
    // a 20 mm radius needs > 44 mm of wall; the 1-cell wall is ~41.5 mm → no cut.
    expect(cutGripNotches(bin, narrow, { enabled: true, radiusMm: 20 })).toBe(bin);
  });
});
