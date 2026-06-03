import type { Point2D } from '../core/offset';

/**
 * Pure scale + page-tiling math for the 1:1 printable plan. No pdf-lib, no DOM — unit-tested.
 * The whole point is true scale: 1 mm of contour → exactly 1 mm on paper, tiled across A4
 * sheets when the object is larger than one printable content area.
 */

/** PDF user-space unit is 1/72 inch; 1 inch = 25.4 mm. */
export const MM_TO_PT = 72 / 25.4;

export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

// A4 portrait + the bands we reserve on each sheet. Because absolute position on the page is
// irrelevant to 1:1 (only the scale + relative geometry matter), we can carve a header strip
// (title + print instruction) and a footer strip (the 50 mm control ruler) out of the sheet
// and lay the contour in the content area between them.
export const A4_W_MM = 210;
export const A4_H_MM = 297;
export const MARGIN_MM = 8;
export const HEADER_MM = 12;
export const RULER_MM = 16;
/** Reference ruler length printed in the footer for the user to measure. */
export const RULER_LEN_MM = 50;
/** Safety cap on tiling so a mis-scaled contour can't spawn hundreds of pages. */
export const MAX_TILES = 36;

/** Printable content area per sheet (mm) — what one tile can hold. */
export const CONTENT_W_MM = A4_W_MM - 2 * MARGIN_MM;
export const CONTENT_H_MM = A4_H_MM - 2 * MARGIN_MM - HEADER_MM - RULER_MM;

export interface PlanBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  wMm: number;
  hMm: number;
}

export interface PlanPage {
  row: number;
  col: number;
  /** Top-left corner of this tile's window, in the contour's mm space. */
  originXMm: number;
  originYMm: number;
}

export interface PlanLayout {
  cols: number;
  rows: number;
  pages: PlanPage[];
  /** Whether tiling was capped at MAX_TILES (the plan is then truncated). */
  capped: boolean;
}

/** Combined bounding box (mm) of one or more contours. Empty input → a zero box at the origin. */
export function bboxOfMm(contours: Point2D[][]): PlanBBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of contours) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, wMm: 0, hMm: 0 };
  }
  return { minX, minY, maxX, maxY, wMm: maxX - minX, hMm: maxY - minY };
}

/**
 * Tile the content bbox across A4 content windows: a `cols × rows` grid, each tile a
 * `CONTENT_W_MM × CONTENT_H_MM` window of the contour mm-space. One page when it fits. Capped
 * at `MAX_TILES` (then `capped: true` and only the first tiles are emitted).
 */
export function planPages(bbox: PlanBBox): PlanLayout {
  const cols = Math.max(1, Math.ceil(bbox.wMm / CONTENT_W_MM || 1));
  const rows = Math.max(1, Math.ceil(bbox.hMm / CONTENT_H_MM || 1));
  const pages: PlanPage[] = [];
  let capped = false;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (pages.length >= MAX_TILES) {
        capped = true;
        return { cols, rows, pages, capped };
      }
      pages.push({
        row,
        col,
        originXMm: bbox.minX + col * CONTENT_W_MM,
        originYMm: bbox.minY + row * CONTENT_H_MM,
      });
    }
  }
  return { cols, rows, pages, capped };
}
