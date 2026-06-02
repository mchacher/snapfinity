# Architecture — 018 3D render transparency

## Pipeline stage touched

**Preview** only (three.js material). No vision / offset / CAD / export change.

## Design

- **Param.** Add `renderOpacity: number` to `Params` (default `1`).
- **Control.** A new `Render` section on the **Preview** tab of `ControlsPanel` with an
  `Opacity` slider (`min 0.2, max 1, step 0.05`). Mirrors the existing mask-opacity slider.
- **Material.** `Viewer` takes an `opacity` prop and applies it to the `meshStandardMaterial`:

  ```
  transparent={opacity < 1}
  opacity={opacity}
  depthWrite={opacity >= 1}   // translucent → don't self-occlude → pocket shows through
  ```

  `depthWrite={false}` while translucent is the key: a single solid mesh would otherwise
  write depth and hide its own back/interior faces, defeating the "see inside" goal.

## Data flow

```
ControlsPanel (slider) → set('renderOpacity', v) → Workspace.params.renderOpacity
                                                  → <Viewer opacity={params.renderOpacity} />
                                                  → meshStandardMaterial transparent/opacity/depthWrite
```

## Files changed

| File | Change |
| ---- | ------ |
| `src/features/workspace/Workspace.tsx` | `renderOpacity` in `Params` + `initialParams`; pass to `Viewer` |
| `src/features/workspace/Viewer.tsx` | `opacity` prop → material `transparent`/`opacity`/`depthWrite` |
| `src/features/workspace/ControlsPanel.tsx` | Preview-tab `Render` section + opacity slider |
| `src/i18n/fr.ts`, `src/i18n/en.ts` | `params.render`, `params.renderOpacity` |

## Risks

- **Transparency sorting artefacts** on a concave self-intersecting mesh — mitigated by
  `depthWrite=false` (reveals interior) and accepted as the intended translucent look; opacity
  = 1 keeps the pristine opaque render.
- No automated test (render/material) — covered by the manual visual check, per the workflow.
