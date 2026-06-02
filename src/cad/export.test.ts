import { beforeAll, describe, expect, it } from 'vitest';
import { initOpenCascadeForNode } from './oc-node';
import { makeBin } from './bin';
import { shapeToStl } from './export';

beforeAll(async () => {
  await initOpenCascadeForNode();
}, 60_000);

const bin = () => makeBin({ cols: 2, rows: 1, heightUnits: 3 });

describe('shapeToStl', () => {
  it('exports a non-empty STL with the default tolerance', async () => {
    const bytes = (await shapeToStl(bin()).arrayBuffer()).byteLength;
    expect(bytes).toBeGreaterThan(1000);
  });

  it('a coarser tolerance yields a smaller mesh', async () => {
    const fine = (await shapeToStl(bin(), { toleranceMm: 0.01 }).arrayBuffer()).byteLength;
    const coarse = (await shapeToStl(bin(), { toleranceMm: 0.3 }).arrayBuffer()).byteLength;
    expect(coarse).toBeLessThan(fine);
  });
});
