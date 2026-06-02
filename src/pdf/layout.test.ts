import { describe, expect, it } from 'vitest';
import type { Point2D } from '../core/offset';
import { CONTENT_W_MM, MM_TO_PT, bboxOfMm, mmToPt, planPages } from './layout';

describe('mmToPt', () => {
  it('converts mm to PDF points (1 in = 25.4 mm = 72 pt)', () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 6);
    expect(mmToPt(1)).toBeCloseTo(MM_TO_PT, 9);
    expect(mmToPt(0)).toBe(0);
  });
});

describe('bboxOfMm', () => {
  it('combines the bbox of several contours', () => {
    const a: Point2D[] = [
      [0, 0],
      [10, 0],
      [10, 5],
    ];
    const b: Point2D[] = [
      [-4, 2],
      [12, 2],
      [3, 8],
    ];
    const box = bboxOfMm([a, b]);
    expect(box).toMatchObject({ minX: -4, minY: 0, maxX: 12, maxY: 8, wMm: 16, hMm: 8 });
  });

  it('returns a zero box for empty input', () => {
    expect(bboxOfMm([])).toMatchObject({ minX: 0, minY: 0, maxX: 0, maxY: 0, wMm: 0, hMm: 0 });
  });
});

describe('planPages', () => {
  it('fits a small object on a single page', () => {
    const layout = planPages(bboxOfMm([[[0, 0], [30, 0], [30, 20]]]));
    expect(layout).toMatchObject({ cols: 1, rows: 1, capped: false });
    expect(layout.pages).toHaveLength(1);
    expect(layout.pages[0]).toMatchObject({ row: 0, col: 0, originXMm: 0, originYMm: 0 });
  });

  it('tiles a wide object across columns', () => {
    const wide = bboxOfMm([[[0, 0], [400, 0], [400, 50]]]); // 400 mm wide
    const layout = planPages(wide);
    expect(layout.cols).toBe(Math.ceil(400 / CONTENT_W_MM));
    expect(layout.rows).toBe(1);
    expect(layout.pages).toHaveLength(layout.cols);
    // second column tile starts one content-width to the right
    expect(layout.pages[1].originXMm).toBeCloseTo(CONTENT_W_MM, 6);
  });
});
