import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Point2D } from '../core/offset';
import {
  A4_H_MM,
  A4_W_MM,
  CONTENT_H_MM,
  CONTENT_W_MM,
  HEADER_MM,
  MARGIN_MM,
  MM_TO_PT,
  RULER_LEN_MM,
  RULER_MM,
  bboxOfMm,
  mmToPt,
  planPages,
  type PlanPage,
} from './layout';

/** UI-supplied (i18n) strings so this builder stays language-agnostic + unit-testable. */
export interface PlanLabels {
  title: string;
  dims: string;
  print: string;
  object: string;
  pocket: string;
  ruler: string;
  pageWord: string;
}

export interface PlanInput {
  /** Detected object outline in mm (drawn solid). */
  objectMm: Point2D[];
  /** Pocket outline (object + clearance) in mm (drawn dashed). May equal/omit the object. */
  pocketMm: Point2D[];
  labels: PlanLabels;
}

const INK = rgb(0.12, 0.16, 0.22); // object outline (slate-800)
const ACCENT = rgb(0.23, 0.56, 0.94); // pocket outline (azure accent)
const MUTED = rgb(0.45, 0.5, 0.56); // ruler + helper text

const PAGE_W_PT = mmToPt(A4_W_MM);
const PAGE_H_PT = mmToPt(A4_H_MM);
const MARGIN_PT = mmToPt(MARGIN_MM);
const HEADER_PT = mmToPt(HEADER_MM);
const RULER_PT = mmToPt(RULER_MM);
const CONTENT_TOP_PT = PAGE_H_PT - MARGIN_PT - HEADER_PT;

/** Map a contour point (mm, image y-down) to page points (y-up) for a given tile origin. */
function toPt(p: Point2D, originXMm: number, originYMm: number): { x: number; y: number } {
  return {
    x: MARGIN_PT + (p[0] - originXMm) * MM_TO_PT,
    y: CONTENT_TOP_PT - (p[1] - originYMm) * MM_TO_PT,
  };
}

/**
 * Build the printable 1:1 top-view plan. Draws the object outline (solid) and the pocket
 * outline (dashed) at true scale, with a 50 mm control ruler + a print-at-100% header,
 * tiled across A4 sheets when larger than one content area. Runs in the browser and in Node
 * (pdf-lib), so it's unit-testable.
 */
export async function buildPlanPdf({ objectMm, pocketMm, labels }: PlanInput): Promise<Blob> {
  const rings = [objectMm, pocketMm].filter((r) => r.length >= 3);
  const bbox = bboxOfMm(rings);
  const layout = planPages(bbox);
  const single = layout.pages.length === 1;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const drawRing = (
    page: ReturnType<typeof doc.addPage>,
    ring: Point2D[],
    origin: PlanPage,
    dashed: boolean,
  ) => {
    if (ring.length < 3) return;
    for (let i = 0; i < ring.length; i += 1) {
      const a = toPt(ring[i], origin.originXMm, origin.originYMm);
      const b = toPt(ring[(i + 1) % ring.length], origin.originXMm, origin.originYMm);
      page.drawLine({
        start: a,
        end: b,
        thickness: dashed ? 1 : 1.2,
        color: dashed ? ACCENT : INK,
        dashArray: dashed ? [3, 2] : undefined,
      });
    }
  };

  for (const tile of layout.pages) {
    const page = doc.addPage([PAGE_W_PT, PAGE_H_PT]);

    // Centre the content on a single sheet (absolute position is irrelevant to 1:1); keep raw
    // tile origins when tiling so the sheets assemble.
    const origin: PlanPage = single
      ? {
          row: 0,
          col: 0,
          originXMm: bbox.minX - (CONTENT_W_MM - bbox.wMm) / 2,
          originYMm: bbox.minY - (CONTENT_H_MM - bbox.hMm) / 2,
        }
      : tile;

    drawRing(page, pocketMm, origin, true);
    drawRing(page, objectMm, origin, false);

    // Header band: title · dims · print-at-100% (+ page label when tiled).
    const headerY = PAGE_H_PT - MARGIN_PT - HEADER_PT * 0.45;
    page.drawText(`${labels.title}  ·  ${labels.dims}`, {
      x: MARGIN_PT,
      y: headerY,
      size: 9,
      font: fontBold,
      color: INK,
    });
    page.drawText(labels.print, {
      x: MARGIN_PT,
      y: headerY - 11,
      size: 7.5,
      font,
      color: MUTED,
    });
    if (!single) {
      const label = `${labels.pageWord} ${tile.row + 1}/${layout.rows} · ${tile.col + 1}/${layout.cols}`;
      const w = font.widthOfTextAtSize(label, 8);
      page.drawText(label, { x: PAGE_W_PT - MARGIN_PT - w, y: headerY, size: 8, font, color: MUTED });
    }

    // Legend (top-right of the header band): solid = object, dashed = pocket.
    const legendY = headerY - 11;
    const legX = PAGE_W_PT - MARGIN_PT - 150;
    page.drawLine({ start: { x: legX, y: legendY + 2 }, end: { x: legX + 16, y: legendY + 2 }, thickness: 1.2, color: INK });
    page.drawText(labels.object, { x: legX + 20, y: legendY, size: 7.5, font, color: MUTED });
    const legX2 = legX + 20 + font.widthOfTextAtSize(labels.object, 7.5) + 10;
    page.drawLine({ start: { x: legX2, y: legendY + 2 }, end: { x: legX2 + 16, y: legendY + 2 }, thickness: 1, color: ACCENT, dashArray: [3, 2] });
    page.drawText(labels.pocket, { x: legX2 + 20, y: legendY, size: 7.5, font, color: MUTED });

    // Footer band: a 50 mm control ruler with 10 mm ticks the user measures to confirm scale.
    const rulerY = MARGIN_PT + RULER_PT * 0.55;
    const rulerX = MARGIN_PT;
    const rulerEnd = rulerX + mmToPt(RULER_LEN_MM);
    page.drawLine({ start: { x: rulerX, y: rulerY }, end: { x: rulerEnd, y: rulerY }, thickness: 1, color: INK });
    for (let mm = 0; mm <= RULER_LEN_MM; mm += 10) {
      const tx = rulerX + mmToPt(mm);
      const tall = mm % 50 === 0;
      page.drawLine({ start: { x: tx, y: rulerY }, end: { x: tx, y: rulerY + (tall ? 6 : 4) }, thickness: 1, color: INK });
    }
    page.drawText(labels.ruler, { x: rulerEnd + 8, y: rulerY - 2, size: 8, font, color: MUTED });
  }

  const bytes = await doc.save();
  // Copy into a fresh ArrayBuffer-backed view so the Blob part is typed as ArrayBuffer (pdf-lib
  // types its output as the wider ArrayBufferLike, which TS rejects as a BlobPart under strict).
  const out = new Uint8Array(bytes.byteLength);
  out.set(bytes);
  return new Blob([out], { type: 'application/pdf' });
}
