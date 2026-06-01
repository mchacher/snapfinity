import { beforeAll, describe, expect, it } from 'vitest';
import { initOpenCascadeForNode } from './oc-node';
import { binDimensions, makeBin } from './bin';

beforeAll(async () => {
  await initOpenCascadeForNode();
}, 60_000);

function outerDims(shape: ReturnType<typeof makeBin>) {
  const [min, max] = shape.boundingBox.bounds;
  return {
    width: max[0] - min[0],
    depth: max[1] - min[1],
    height: max[2] - min[2],
  };
}

describe('binDimensions', () => {
  it('applies the Gridfinity gap and base height', () => {
    expect(binDimensions({ cols: 2, rows: 1, heightUnits: 3 })).toEqual({
      width: 83.5,
      depth: 41.5,
      height: 25.75,
    });
  });

  it('supports the compact 36 mm pitch', () => {
    expect(binDimensions({ cols: 1, rows: 1, heightUnits: 1, pitchMm: 36 }).width).toBe(35.5);
  });
});

describe('makeBin geometry', () => {
  it.each([
    [1, 1, 3, 41.5, 41.5, 25.75],
    [2, 1, 3, 83.5, 41.5, 25.75],
    [3, 2, 5, 125.5, 83.5, 39.75],
  ])('%ix%i h%i has the expected outer bounding box', (cols, rows, h, w, d, z) => {
    const dims = outerDims(makeBin({ cols, rows, heightUnits: h }));
    expect(dims.width).toBeCloseTo(w, 1);
    expect(dims.depth).toBeCloseTo(d, 1);
    expect(dims.height).toBeCloseTo(z, 1);
  });

  it('exports a non-empty STL', async () => {
    const bin = makeBin({ cols: 2, rows: 1, heightUnits: 3 });
    const buffer = await bin.blobSTL().arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
