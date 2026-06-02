import { beforeAll, describe, expect, it } from 'vitest';
import { initOpenCascadeForNode } from './oc-node';
import { DEFAULT_PITCH_MM, PITCH_MAX_MM, PITCH_MIN_MM, binDimensions, makeBin } from './bin';

beforeAll(async () => {
  await initOpenCascadeForNode();
}, 60_000);

function outerDims(shape: ReturnType<typeof makeBin>) {
  const [min, max] = shape.boundingBox.bounds;
  return { width: max[0] - min[0], depth: max[1] - min[1], height: max[2] - min[2] };
}

describe('binDimensions', () => {
  it('applies the Gridfinity clearance and stack heights', () => {
    const d = binDimensions({ cols: 2, rows: 1, heightUnits: 3 });
    expect(d.width).toBe(83.5);
    expect(d.depth).toBe(41.5);
    expect(d.height).toBeCloseTo(29.13, 2);
  });

  it('scales the footprint with pitch', () => {
    expect(binDimensions({ cols: 1, rows: 1, heightUnits: 1, pitchMm: 36 }).width).toBe(35.5);
    expect(binDimensions({ cols: 1, rows: 1, heightUnits: 1, pitchMm: 30 }).width).toBe(29.5);
  });

  it('rejects a pitch outside the supported range', () => {
    expect(DEFAULT_PITCH_MM).toBe(42);
    expect(() =>
      binDimensions({ cols: 1, rows: 1, heightUnits: 1, pitchMm: PITCH_MIN_MM - 1 }),
    ).toThrow();
    expect(() =>
      binDimensions({ cols: 1, rows: 1, heightUnits: 1, pitchMm: PITCH_MAX_MM + 1 }),
    ).toThrow();
  });
});

describe('makeBin geometry', () => {
  it.each([
    [42, 1, 1, 3],
    [42, 2, 1, 3],
    [36, 1, 1, 3],
    [30, 1, 1, 3],
  ])('pitch %i %ix%i h%i matches binDimensions bbox', (pitchMm, cols, rows, heightUnits) => {
    const expected = binDimensions({ cols, rows, heightUnits, pitchMm });
    const dims = outerDims(makeBin({ cols, rows, heightUnits, pitchMm }));
    expect(dims.width).toBeCloseTo(expected.width, 1);
    expect(dims.depth).toBeCloseTo(expected.depth, 1);
    expect(dims.height).toBeCloseTo(expected.height, 1);
  });

  it('the stacking lip changes the geometry', async () => {
    const withLip = (
      await makeBin({ cols: 1, rows: 1, heightUnits: 3, includeLip: true }).blobSTL().arrayBuffer()
    ).byteLength;
    const withoutLip = (
      await makeBin({ cols: 1, rows: 1, heightUnits: 3, includeLip: false }).blobSTL().arrayBuffer()
    ).byteLength;
    expect(withLip).not.toBe(withoutLip);
  });

  it('exports a non-empty STL', async () => {
    const buffer = await makeBin({ cols: 2, rows: 1, heightUnits: 3 }).blobSTL().arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
