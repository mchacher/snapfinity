# Architecture — 019 printable 1:1 top-view PDF plan

## Pipeline stage touched

A new **export** branch off the existing contour. Reuses the contours Workspace already
computes (`contour` = object outline px, `offsetContour` = pocket px) + `scaleMmPerPx`. No
vision/CAD change.

```
contour (px) ─┐
offsetContour (px) ─┼─×scaleMmPerPx→ mm ─→ pdf/layout (tiling) ─→ pdf/plan (pdf-lib) ─→ Blob ─→ download
scaleMmPerPx ─┘
```

## Modules

### `src/pdf/layout.ts` (pure — unit-tested)

Scale + page-tiling math, no pdf-lib, no DOM:

```
MM_TO_PT = 72 / 25.4
A4 = { wMm: 210, hMm: 297 }, MARGIN_MM = 10  → printable wMm/hMm
bboxOfMm(contours: Point2D[][]): { minX, minY, maxX, maxY, wMm, hMm }
planPages(bbox, printable): { cols, rows, pages: [{ row, col, originMm: {x,y} }] }
  // grid of A4 windows covering the content; single page when it fits
mmToPt(mm: number): number
```

### `src/pdf/plan.ts` (pdf-lib adapter — node-testable)

```
buildPlanPdf({ objectMm, pocketMm, labels }): Promise<Blob>
```

- Computes the layout, creates one A4 page per tile.
- Per page: draw the slice of each contour as line segments (solid for object, dashed for
  pocket — pdf-lib `drawLine` with `dashArray`), the 50 mm ruler, the header text
  (bbox W×H, pitch, "print at 100 %"), crop marks + `row,col` label when tiled.
- Coordinates: page origin is bottom-left (y-up); image contours are y-down → flip y when
  mapping mm→pt within the page window.
- Returns `new Blob([bytes], { type: 'application/pdf' })`.

`pdf-lib` runs in Node too, so `buildPlanPdf` is unit-testable (page count, non-empty bytes)
without a browser.

**Print robustness.** Fonts are **embedded + subset** via `@pdf-lib/fontkit` (bundled Inter
WOFF faces, passed in as `fonts` bytes so the builder stays Vite/Node-agnostic), and the PDF is
saved with `useObjectStreams: false` (classic xref, no compressed object streams). Non-embedded
base-14 fonts + compressed streams cause spooler print failures (Acrobat → physical printer);
this combo fixes it. The browser fetches the bundled `*.woff?url` assets at export (lazy); the
test reads them from `node_modules`.

## UI wiring

- **Header**: a `Plan PDF` button in the export group, `disabled` unless `canExportPdf`
  (token found + contour ≥ 3 pts). New prop `onExportPdf` + `canExportPdf`.
- **Workspace**:
  - `canExportPdf = scaleMmPerPx != null && contour.length >= 3`.
  - `exportPdf()` — convert `contour`/`offsetContour` px → mm (`× scaleMmPerPx`), call
    `buildPlanPdf`, `downloadBlob(blob, 'snapfinity-plan.pdf')`.
  - Pass `t()` labels (ruler text, header, print instruction) into the builder for i18n.

## Files added / changed

| File | Change |
| ---- | ------ |
| `src/pdf/layout.ts` | **new** — pure scale + tiling math |
| `src/pdf/layout.test.ts` | **new** — unit tests |
| `src/pdf/plan.ts` | **new** — pdf-lib builder |
| `src/pdf/plan.test.ts` | **new** — Node test (page count, non-empty) |
| `src/features/workspace/Header.tsx` | `Plan PDF` button + `onExportPdf`/`canExportPdf` |
| `src/features/workspace/Workspace.tsx` | px→mm + `exportPdf` + gating |
| `src/i18n/fr.ts`, `src/i18n/en.ts` | `export.pdf`, ruler/header/print strings |
| `package.json` | `pdf-lib` dependency |

## Risks

- **Printer rescaling** silently breaks 1:1 → mitigated by the on-sheet 50 mm ruler + the
  explicit "print at 100 %" instruction (user verifies once).
- **Tiling coordinate math** → the pure `layout.ts` is unit-tested (page count + windows);
  visual assembly is a manual check.
- **pdf-lib bundle size** (~1 MB) → it's only pulled where used; acceptable next to the WASM.
  Lazy-import in `exportPdf` so it stays off the first-paint path.
