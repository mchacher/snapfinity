# Plan — 018 3D render transparency

## Implementation steps

1. [ ] `Workspace.tsx` — add `renderOpacity: number` to `Params` (+ `initialParams: 1`);
   pass `opacity={params.renderOpacity}` to `<Viewer>`.
2. [ ] `Viewer.tsx` — accept `opacity` prop; set material `transparent`/`opacity`/`depthWrite`.
3. [ ] `ControlsPanel.tsx` — Preview-tab `Render` section with an opacity slider (0.2–1, 0.05).
4. [ ] `i18n/fr.ts` + `i18n/en.ts` — `params.render`, `params.renderOpacity`.

## Test plan

| Module | Scenario | Type |
| ------ | -------- | ---- |
| Viewer material | opacity 1 → opaque; opacity < 1 → translucent, pocket visible | **manual visual** |
| i18n | new keys present in both FR and EN | unit (existing i18n parity test, if any) |

**Why manual.** This is a three.js material/render setting — not cheaply assertable in the
Node test env (no WebGL). The existing i18n parity test (if present) will catch a missing
translation key; otherwise typecheck guards the key usage.

## Validation (Gate 4)

```
npm run build / lint / typecheck   # clean
npm test                           # all pass
```

Manual: `npm run dev`, Preview tab, drag Opacity down → the bin turns translucent and the
pocket cavity shows through; back at 1 → identical to before.
