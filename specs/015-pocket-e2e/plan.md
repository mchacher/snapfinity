# Plan — 015 pocket end-to-end

## Implementation steps

1. **Pure `core/footprint.ts` + tests** — `contourToFootprintMm(offsetPx, scaleMmPerPx)`.
2. **`useBin`** — accept `footprintMm`/`thicknessMm`/`enabled`; build `makeBinWithPocket` when
   `enabled` + footprint valid, else `makeBin`; gate + debounce the effect.
3. **Workspace** — lift contour/offset/footprint into `useMemo`; pass footprint + `enabled` to
   `useBin`; pass px contour/offset to `OutlinePanel`.
4. **OutlinePanel** — consume `contour`/`offsetContour` props (drop local compute).
5. Manual visual check of the 3D pocket + export.

## Task breakdown

- [x] `contourToFootprintMm` + `footprint.test.ts` (3)
- [x] `useBin` pocket + gating (Preview-only) + signature guard; pocket depth clamped in pocket.ts
- [x] Workspace lift + wiring (contour/offset/footprint, enabled=preview)
- [x] OutlinePanel consumes contour/offset props
- [x] typecheck/lint/test(74)/build green
- [x] verified via Playwright: Preview tab shows the scissors-shaped pocket (export = same shape)

## Test plan (before code)

| Module | Nominal | Edge | Type |
| ------ | ------- | ---- | ---- |
| `contourToFootprintMm` | square px @ scale → centred mm square (origin), y negated | empty → `[]`; scale maps size correctly | unit |
| `useBin` pocket | enabled + footprint → pocketed shape (geometry built) | not enabled → plain bin; no footprint → plain bin | (covered by CAD tests + manual) |
| Pocket geometry | reuse spec 006 tests (`makeBinWithPocket` bbox/volume) | — | (existing) |

**Manual/visual:** `npm run dev` → upload, tune the contour, open **Aperçu 3D** → the bin shows
the tool-shaped cavity; download STL → opens with the pocket. Paint on Outline → no freeze;
re-open Preview → pocket reflects the edits.

## Out of scope (next)

- Contour point-editing; interior holes; 3MF; base variants; web-worker CAD offload.
