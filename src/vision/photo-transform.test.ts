import { describe, expect, it } from 'vitest';
import type { Point2D } from '../core/offset';
import { normaliseCrop, straightenAngleDeg } from './photo-transform';

describe('straightenAngleDeg', () => {
  it('leaves a horizontal line unchanged', () => {
    expect(straightenAngleDeg([0, 0], [100, 0])).toBeCloseTo(0, 6);
    expect(straightenAngleDeg([100, 0], [0, 0])).toBeCloseTo(0, 6); // reversed = same
  });

  it('levels a slightly tilted (near-horizontal) line', () => {
    // 5° down-right → rotate by −5° to level it
    const p2: Point2D = [100, 100 * Math.tan((5 * Math.PI) / 180)];
    expect(straightenAngleDeg([0, 0], p2)).toBeCloseTo(-5, 4);
  });

  it('snaps a near-vertical line to vertical', () => {
    // 85° line → vertical target, rotate by +5°
    const p2: Point2D = [100 * Math.tan((5 * Math.PI) / 180), 100];
    expect(straightenAngleDeg([0, 0], p2)).toBeCloseTo(5, 4);
  });

  it('chooses horizontal at the 45° boundary', () => {
    expect(straightenAngleDeg([0, 0], [100, 100])).toBeCloseTo(-45, 6);
  });
});

describe('normaliseCrop', () => {
  it('maps a drag to a normalised [0,1] rect', () => {
    expect(normaliseCrop([100, 50], [300, 250], 400, 500)).toEqual({ x: 0.25, y: 0.1, w: 0.5, h: 0.4 });
  });

  it('is order-independent (reversed drag)', () => {
    expect(normaliseCrop([300, 250], [100, 50], 400, 500)).toEqual({ x: 0.25, y: 0.1, w: 0.5, h: 0.4 });
  });

  it('clamps to the image bounds', () => {
    const r = normaliseCrop([-50, -50], [600, 700], 400, 500);
    expect(r).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  });
});
