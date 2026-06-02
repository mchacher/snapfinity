# Plan — 021 straighten contour edges

## Steps

1. [ ] `core/contour.ts` — `dominantAxisAngle`, `rectifyStraightEdges(points, toleranceDeg)`,
   `refineContour(points, opts)`.
2. [ ] `core/contour.test.ts` — rectify cases.
3. [ ] `Workspace.tsx` — use `refineContour`; add `straightenEdges`, `straightenToleranceDeg`.
4. [ ] `ControlsPanel.tsx` — Outline tab toggle + tolerance slider; i18n `params.straighten`,
   `params.straightenTol`.
5. [ ] `docs/specs-index.md` row 021.

## Test plan

| Module | Scenario | Type |
| ------ | -------- | ---- |
| `rectifyStraightEdges` | noisy **axis-aligned** rectangle → all 4 edges become axis-aligned (|dx| or |dy| ≈ 0) | unit |
| | noisy **rotated** (≈20°) rectangle → edges become parallel/perpendicular to the 20° axis | unit |
| | a diagonal edge (45° to axis) is left ~unchanged | unit |
| | tolerance 0 → returns input unchanged; < 3 pts → unchanged | unit |
| `refineContour` | straighten off → equals `smoothContour`; on → crisp (no chaikin) | unit |
| overlay + pocket | toggle straightens the live outline + the 3D pocket | **manual visual** |

## Validation (Gate 4)

```
npm run build / lint / typecheck   # clean
npm test                           # all pass
```

Manual: `npm run dev`, a boxy object → enable Straighten → edges snap crisp; tune tolerance.
