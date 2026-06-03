import { describe, expect, it } from 'vitest';
import { buildLiveWire, edgeCost } from './livewire';

const W = 24;
const H = 24;

/** A grayscale image with a hard vertical edge at x = 12 (left 0, right 255). */
function verticalEdge(): Float32Array {
  const g = new Float32Array(W * H);
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) g[y * W + x] = x < 12 ? 0 : 255;
  return g;
}

describe('edgeCost', () => {
  it('is cheap on the edge and expensive on flat areas', () => {
    const cost = edgeCost(verticalEdge(), W, H);
    const onEdge = cost[10 * W + 11]; // beside the step
    const flat = cost[10 * W + 3]; // deep in the flat black region
    expect(onEdge).toBeLessThan(flat);
    expect(onEdge).toBeLessThan(0.2); // strong edge → near the floor
    expect(flat).toBeGreaterThan(0.9); // flat → near 1
  });
});

describe('buildLiveWire', () => {
  it('returns no path before a seed is set', () => {
    const lw = buildLiveWire(verticalEdge(), W, H);
    expect(lw.pathTo(12, 20)).toEqual([]);
  });

  it('snaps the shortest path onto the edge column', () => {
    const lw = buildLiveWire(verticalEdge(), W, H);
    lw.setSeed(12, 3);
    const path = lw.pathTo(12, 20);
    expect(path.length).toBeGreaterThan(10);
    // seed-first, ends at the target
    expect(path[0]).toEqual([12, 3]);
    expect(path[path.length - 1]).toEqual([12, 20]);
    // every step is 8-connected (adjacent, never a jump)
    for (let i = 1; i < path.length; i += 1) {
      const dx = Math.abs(path[i][0] - path[i - 1][0]);
      const dy = Math.abs(path[i][1] - path[i - 1][1]);
      expect(dx <= 1 && dy <= 1 && dx + dy > 0).toBe(true);
    }
    // the path hugs the edge (x stays at the step columns), not wandering into the flat region
    for (const [x] of path) expect(x).toBeGreaterThanOrEqual(10);
    for (const [x] of path) expect(x).toBeLessThanOrEqual(13);
  });

  it('prefers the edge over a straight diagonal through flat pixels', () => {
    // From a point on the edge to another on the edge, the cost along the edge must beat a detour.
    const lw = buildLiveWire(verticalEdge(), W, H);
    lw.setSeed(11, 4);
    const onEdge = lw.pathTo(11, 18);
    expect(onEdge.every(([x]) => x >= 10 && x <= 13)).toBe(true);
  });
});
