import { describe, expect, it } from 'vitest';
import { chooseSegmentMode } from './segment-mode';

describe('chooseSegmentMode', () => {
  // Measured fractions from tools/cv/compare-modes.ts (cleaned mask area / frame).
  it('switches to edges for transparent objects (u2netp found ~nothing, edges object-sized)', () => {
    expect(chooseSegmentMode(0.0028, 0.0546)).toBe('edges'); // transparent screwdriver
    expect(chooseSegmentMode(0.0008, 0.026)).toBe('edges'); // thin white pen
  });

  it('keeps u2netp for opaque objects (healthy u2netp coverage)', () => {
    expect(chooseSegmentMode(0.122, 0.15)).toBe('standard'); // scissors-white
    expect(chooseSegmentMode(0.205, 0.203)).toBe('standard'); // hole-punch
    expect(chooseSegmentMode(0.07, 0.005)).toBe('standard'); // eraser (edges barely found anything)
  });

  it('does NOT switch on a textured background even when u2netp is lowish', () => {
    // wood grain blows the edge silhouette up to most of the frame → not object-sized
    expect(chooseSegmentMode(0.101, 0.743)).toBe('standard'); // scissors-wood
    expect(chooseSegmentMode(0.079, 0.93)).toBe('standard'); // caliper-chrome on wood
  });

  it('respects the boundaries', () => {
    expect(chooseSegmentMode(0.024, 0.1)).toBe('edges'); // just below the u2netp-fail cut
    expect(chooseSegmentMode(0.026, 0.1)).toBe('standard'); // just above → u2netp is fine
    expect(chooseSegmentMode(0.001, 0.005)).toBe('standard'); // edge blob too small
    expect(chooseSegmentMode(0.001, 0.6)).toBe('standard'); // edge blob too big (background)
  });
});
