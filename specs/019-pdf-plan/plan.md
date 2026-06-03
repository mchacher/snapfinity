# Plan — 019 printable 1:1 top-view PDF plan

## Implementation steps (dependency order)

1. **Dependency**
   - [x] `npm i pdf-lib`.

2. **Pure logic**
   - [x] `src/pdf/layout.ts` — `MM_TO_PT`, `mmToPt`, A4/printable constants, `bboxOfMm`,
     `planPages(bbox, printable)` (tiling grid + per-page mm windows).

3. **PDF builder (adapter)**
   - [x] `src/pdf/plan.ts` — `buildPlanPdf({ objectMm, pocketMm, labels })`: layout → A4 pages
     → draw object (solid) + pocket (dashed) slices, 50 mm ruler, header text, crop marks when
     tiled → `Blob`.

4. **UI**
   - [x] `Header.tsx` — `Plan PDF` button (`onExportPdf`, `canExportPdf`).
   - [x] `Workspace.tsx` — `canExportPdf` gate; `exportPdf()` (px→mm, lazy-import builder,
     download); pass i18n labels.
   - [x] `i18n` — `export.pdf` + ruler/header/print strings (FR/EN).

5. **Tests + docs**
   - [x] `src/pdf/layout.test.ts`, `src/pdf/plan.test.ts`.
   - [x] `docs/specs-index.md` row 019; check off criteria/tasks.

## Test plan

| Module | Scenario | Type |
| ------ | -------- | ---- |
| `pdf/layout.ts` `mmToPt` | `25.4 mm → 72 pt`; `1 mm → 72/25.4` | unit |
| `pdf/layout.ts` `bboxOfMm` | combined bbox + W/H of multiple contours | unit |
| `pdf/layout.ts` `planPages` | content < printable → 1 page; wide → N×1; large → N×M; per-page windows tile the bbox | unit |
| `pdf/plan.ts` `buildPlanPdf` | small contour → 1-page non-empty PDF (`%PDF` header, bytes > 0); large contour → multi-page (page count = layout) | unit (Node, pdf-lib) |
| Header gating | button disabled with no token/contour | (typecheck + manual) |
| End-to-end print | print at 100 % → 50 mm ruler measures 50 mm; object sits on the outline | **manual** |

**Why manual for the print check.** True-scale can only be confirmed on a physical printout
(printer scaling). The layout math + PDF structure are unit-tested; the ruler + "print at
100 %" instruction let the user verify scale once.

## Validation (Gate 4)

```
npm run build / lint / typecheck   # clean
npm test                           # all pass (+ layout & plan tests)
```

Manual: `npm run dev`, analyse a photo with a token, click **Plan PDF**, print at 100 %,
measure the 50 mm ruler, lay the real object on the outline.
