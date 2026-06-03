import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import type { Point2D } from '../core/offset';
import { buildPlanPdf, type PlanFonts, type PlanLabels } from './plan';

const labels: PlanLabels = {
  title: 'Snapfinity 1:1',
  dims: '30 × 20 mm',
  print: 'Print at 100%',
  object: 'Object',
  pocket: 'Pocket',
  ruler: '50 mm',
  pageWord: 'Page',
};

const ttf = (file: string) =>
  new Uint8Array(readFileSync(`node_modules/@fontsource/inter/files/${file}`));
const fonts: PlanFonts = {
  regular: ttf('inter-latin-400-normal.woff'),
  bold: ttf('inter-latin-700-normal.woff'),
};

const rect = (w: number, h: number): Point2D[] => [
  [0, 0],
  [w, 0],
  [w, h],
  [0, h],
];

async function pageCount(blob: Blob): Promise<number> {
  const doc = await PDFDocument.load(await blob.arrayBuffer());
  return doc.getPageCount();
}

describe('buildPlanPdf', () => {
  it('produces a single-page PDF for a small object', async () => {
    const blob = await buildPlanPdf({ objectMm: rect(30, 20), pocketMm: rect(32, 22), labels, fonts });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(blob.type).toBe('application/pdf');
    expect(bytes.length).toBeGreaterThan(500);
    // PDF magic header "%PDF"
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('%PDF');
    // the font must be EMBEDDED (a /FontFile stream) — non-embedded fonts fail at the spooler
    expect(Buffer.from(bytes).includes('FontFile')).toBe(true);
    expect(await pageCount(blob)).toBe(1);
  });

  it('tiles a large object across multiple pages', async () => {
    const big = rect(400, 60); // wider than one A4 content area
    const blob = await buildPlanPdf({ objectMm: big, pocketMm: big, labels, fonts });
    expect(await pageCount(blob)).toBeGreaterThan(1);
  });

  it('still builds when the pocket ring is absent', async () => {
    const blob = await buildPlanPdf({ objectMm: rect(40, 25), pocketMm: [], labels, fonts });
    expect(await pageCount(blob)).toBe(1);
  });
});
