# Plan 027 — edge segmentation + auto selector

1. **`src/vision/edges.ts`** — `edgeMask(imageData, ww, wh)` (opencv, from the validated proto) +
   `chooseSegmentMode(u2netpFrac, edgeFrac)` (pure). Add `edges.test.ts` for `chooseSegmentMode`
   (measured fractions: transparent → edges; opaque/textured → standard; boundary cases).
2. **`analyze.ts`** — `deriveMask(a, threshold, mode = 'standard')`: build u2netp + (for
   edges/auto) edge work masks, clean, measure, select via `chooseSegmentMode`, then the existing
   `outerContour`/bbox on the chosen mask. Keep `framingKey`/`FramedPhoto` lazy-safe (no new eager
   WASM imports anywhere).
3. **`usePhotoAnalysis.ts`** — `useDerivedMask(result, threshold, mode)` (type-only analyze import).
4. **`Workspace.tsx`** — `segmentMode` param (default `auto`); pass to `useDerivedMask`.
5. **`ControlsPanel.tsx`** — Détourage section: a `Tabs` Auto / Standard / Contours at the top.
6. **i18n** — `segment`, `segAuto`, `segStandard`, `segEdges`.
7. **Oracle + fixture** — add `dataset/raw/screw_driver.jpeg`; a tsx oracle overlay for edges/auto;
   eyeball the screwdriver (full contour) + an opaque control (still u2netp).
8. **Validate** — `typecheck` / `lint` / `build`; **full `vitest run` green (no hang)**; PR on
   `feat/edge-detect`, index row 027.

Remove the throwaway `tools/cv/edge-proto.ts` once `edges.ts` lands; keep `compare-modes.ts` as a
tuning tool (or fold into the oracle).
