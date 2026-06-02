import { beforeAll, describe, expect, it } from 'vitest';
import { initOpenCascadeForNode } from './oc-node';
import { makeBin } from './bin';
import { meshToArrays } from './mesh-arrays';

beforeAll(async () => {
  await initOpenCascadeForNode();
}, 60_000);

describe('meshToArrays', () => {
  it('meshes a real bin into consistent transferable typed arrays', () => {
    const { positions, normals, index } = meshToArrays(makeBin({ cols: 2, rows: 1, heightUnits: 3 }));

    expect(positions).toBeInstanceOf(Float32Array);
    expect(normals).toBeInstanceOf(Float32Array);
    expect(index).toBeInstanceOf(Uint32Array);

    expect(positions.length).toBeGreaterThan(0);
    // 3 floats per vertex, 3 indices per triangle.
    expect(positions.length % 3).toBe(0);
    expect(normals.length).toBe(positions.length);
    expect(index.length % 3).toBe(0);

    // Every index must reference a real vertex.
    const vertexCount = positions.length / 3;
    let maxIndex = 0;
    for (const i of index) if (i > maxIndex) maxIndex = i;
    expect(maxIndex).toBeLessThan(vertexCount);
  });
});
