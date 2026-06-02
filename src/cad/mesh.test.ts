import { beforeAll, describe, expect, it } from 'vitest';
import { initOpenCascadeForNode } from './oc-node';
import { makeBin } from './bin';
import { arraysToGeometry, shapeToGeometry } from './mesh';
import type { MeshArrays } from './cad-messages';

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

describe('arraysToGeometry', () => {
  it('rebuilds a BufferGeometry from raw worker mesh arrays', () => {
    const mesh: MeshArrays = {
      positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
      normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
      index: new Uint32Array([0, 1, 2]),
    };
    const geometry = arraysToGeometry(mesh);
    expect(geometry.getAttribute('position').count).toBe(3);
    expect(geometry.getAttribute('normal').count).toBe(3);
    expect(geometry.getIndex()?.count).toBe(3);
  });
});
