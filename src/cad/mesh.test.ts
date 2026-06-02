import { beforeAll, describe, expect, it } from 'vitest';
import { initOpenCascadeForNode } from './oc-node';
import { makeBin } from './bin';
import { shapeToGeometry } from './mesh';

beforeAll(async () => {
  await initOpenCascadeForNode();
}, 60_000);

describe('shapeToGeometry', () => {
  it('produces a BufferGeometry with positions, normals and an index', () => {
    const geometry = shapeToGeometry(makeBin({ cols: 2, rows: 1, heightUnits: 3 }));
    expect(geometry.getAttribute('position').count).toBeGreaterThan(0);
    expect(geometry.getAttribute('normal').count).toBeGreaterThan(0);
    expect(geometry.getIndex()?.count).toBeGreaterThan(0);
  });
});
