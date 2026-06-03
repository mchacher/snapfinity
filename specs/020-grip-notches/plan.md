# Plan — 020 side grip notches

## Steps

1. [ ] `src/cad/notches.ts` — `NotchConfig` + `cutGripNotches(bin, binParams, notch)`:
   compute W/D/rimZ, spacing + guards, cut two `makeCylinder` scoops on the front rim.
2. [ ] Worker plumbing — `cad-messages` (`notch` on build), `cad.worker` (apply after build),
   `cad-client` (`buildBin(..., notch)`).
3. [ ] `useBin` — pass `notch` from params; include in `sig`.
4. [ ] `Params` + `initialParams` (`gripNotches: false`, `notchRadiusMm: 9`); ControlsPanel
   toggle + radius slider (Preview tab); i18n `params.grip`, `params.gripSize`.
5. [ ] `src/cad/notches.test.ts`; `docs/specs-index.md` row 020.

## Test plan

| Module | Scenario | Type |
| ------ | -------- | ---- |
| `cad/notches.ts` | enabled → outer bbox unchanged vs plain bin; still meshable (STL bytes > 0) | unit (Node OC) |
| | disabled → returns the bin unchanged | unit |
| | wall too short for radius → no throw (degrades gracefully) | unit |
| worker + UI | toggle adds two front-rim notches; export works | **manual visual** |

## Validation (Gate 4)

```
npm run build / lint / typecheck   # clean
npm test                           # all pass
```

Manual: `npm run dev`, Preview tab, enable grip notches → two finger scoops on the front rim;
adjust radius; export.
