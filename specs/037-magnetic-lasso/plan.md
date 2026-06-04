# Plan 037 — magnetic lasso

1. **`core/livewire.ts`** (pure) — `edgeCost` (Sobel), `buildLiveWire` (Dijkstra + binary heap),
   `setSeed`, `pathTo`. **Unit tests** (`core/livewire.test.ts`): cost low on edges / high on flat;
   shortest path snaps to a synthetic edge + is 8-connected.
2. **`LassoEditor.tsx`** — build the cost map from the framed photo (downscaled grayscale); click =
   anchor (re-seed), move = live wire preview, click-first / double-click = close, Backspace = undo,
   Esc = cancel; SVG render (committed + live + anchor dots, working-px viewBox).
3. **`PhotoOverlay`** — `tool === 'lasso'` renders `LassoEditor`; suppress the canvas auto-contour;
   props `onLasso` / `onCancelLasso`.
4. **`Workspace`** — `FrameTool += 'lasso'`; `onLasso(ring)` → `simplifyForEdit` → editor;
   `OutlinePanel` plumbing; `canLasso`.
5. **`ControlsPanel`** — Magnetic-lasso button (`Lasso`) + hint in Détourage. i18n FR/EN
   (`params.lasso*`).
6. **Validate** — `typecheck` / `lint` / `build`; full `vitest run` green (no hang); headless test
   (trace a loop → close → editable contour, 0 console errors). CHANGELOG `[Unreleased]`; index 037.
7. Commit **locally**; **hold push/PR/merge for the user's go**.
