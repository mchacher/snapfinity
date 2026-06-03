import { describe, expect, it } from 'vitest';
import type { Point2D } from '../core/offset';
import {
  MIN_CROP,
  defaultCropBox,
  moveCropBox,
  normaliseCrop,
  resizeCropBox,
  straightenAngleDeg,
  type CropRect,
} from './photo-transform';

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

const expectBox = (r: CropRect, e: CropRect) => {
  expect(r.x).toBeCloseTo(e.x, 6);
  expect(r.y).toBeCloseTo(e.y, 6);
  expect(r.w).toBeCloseTo(e.w, 6);
  expect(r.h).toBeCloseTo(e.h, 6);
};

describe('defaultCropBox', () => {
  it('is a centred inset rectangle', () => {
    expectBox(defaultCropBox(0.1), { x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  });
});

describe('resizeCropBox', () => {
  const box: CropRect = { x: 0.2, y: 0.2, w: 0.6, h: 0.6 }; // edges at 0.2 / 0.8

  it('moves only the edges its letters name', () => {
    // SE corner → right + bottom follow, left/top stay
    expectBox(resizeCropBox(box, 'se', 0.9, 0.7), { x: 0.2, y: 0.2, w: 0.7, h: 0.5 });
    // E edge → only right moves
    expectBox(resizeCropBox(box, 'e', 0.5, 0.99), { x: 0.2, y: 0.2, w: 0.3, h: 0.6 });
    // N edge → only top moves
    expectBox(resizeCropBox(box, 'n', 0.99, 0.35), { x: 0.2, y: 0.35, w: 0.6, h: 0.45 });
    // NW corner → left + top follow
    expectBox(resizeCropBox(box, 'nw', 0.1, 0.05), { x: 0.1, y: 0.05, w: 0.7, h: 0.75 });
  });

  it('enforces the minimum side (handle cannot cross its opposite edge)', () => {
    const r = resizeCropBox(box, 'w', 0.95, 0.5); // drag left past the right edge
    expect(r.x).toBeCloseTo(0.8 - MIN_CROP, 6);
    expect(r.w).toBeCloseTo(MIN_CROP, 6);
  });

  it('clamps the pointer to [0,1]', () => {
    expectBox(resizeCropBox(box, 'se', 5, 5), { x: 0.2, y: 0.2, w: 0.8, h: 0.8 });
  });
});

describe('moveCropBox', () => {
  it('translates the zone', () => {
    expectBox(moveCropBox({ x: 0.2, y: 0.2, w: 0.5, h: 0.5 }, 0.1, -0.1), {
      x: 0.3,
      y: 0.1,
      w: 0.5,
      h: 0.5,
    });
  });

  it('keeps the zone inside the image', () => {
    const box: CropRect = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 };
    expectBox(moveCropBox(box, 1, 1), { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }); // hits the far edge
    expectBox(moveCropBox(box, -1, -1), { x: 0, y: 0, w: 0.5, h: 0.5 }); // hits the near edge
  });
});
