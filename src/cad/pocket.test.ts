import { beforeAll, describe, expect, it } from 'vitest';
import { initOpenCascadeForNode } from './oc-node';
import { binDimensions } from './bin';
import { makeBinWithPocket } from './pocket';
import type { Point2D } from '../core/offset';

beforeAll(async () => {
  await initOpenCascadeForNode();
}, 60_000);

const centredSquare = (half: number): Point2D[] => [
  [-half, -half],
  [half, -half],
  [half, half],
  [-half, half],
];

function bboxOf(shape: { boundingBox: { bounds: [number[], number[]] } }) {
  const [min, max] = shape.boundingBox.bounds;
  return { width: max[0] - min[0], depth: max[1] - min[1], height: max[2] - min[2] };
}

describe('makeBinWithPocket', () => {
  const params = { cols: 2, rows: 1, heightUnits: 3 };

  it('keeps the outer bin dimensions (pocket is inside)', () => {
    const expected = binDimensions(params);
    const dims = bboxOf(makeBinWithPocket(params, centredSquare(15)));
    expect(dims.width).toBeCloseTo(expected.width, 1);
    expect(dims.depth).toBeCloseTo(expected.depth, 1);
    expect(dims.height).toBeCloseTo(expected.height, 1);
  });

  it('exports a meshable, non-empty STL', async () => {
    const pocketed = (
      await makeBinWithPocket(params, centredSquare(15)).blobSTL().arrayBuffer()
    ).byteLength;
    expect(pocketed).toBeGreaterThan(1000);
  });

  it('rejects a degenerate footprint or non-positive depth', () => {
    expect(() =>
      makeBinWithPocket(params, [
        [0, 0],
        [1, 1],
      ]),
    ).toThrow();
    expect(() => makeBinWithPocket(params, centredSquare(15), { depthMm: 0 })).toThrow();
  });
});
