# Architecture 034 — alignment grid

## Where the grid is drawn

`PhotoOverlay` already layers interactive overlays on top of the image `<canvas>` as absolutely-
positioned siblings (brush cursor, straighten line, crop box) inside a
`relative inline-flex` wrapper sized to the canvas. The grid is one more such layer:

```
<div className="relative inline-flex ...">
  <canvas/>                                  ← photo + mask tint + contour (drawn in 2D ctx)
  {showGrid && <svg .../>}                    ← NEW: alignment grid (this spec)
  {brush cursor} {straighten} {crop ...}      ← interactive layers stay on top
</div>
```

The grid `<svg>` is `pointer-events-none absolute inset-0 h-full w-full`, so it exactly covers the
canvas's displayed rect (the wrapper shrinks to the canvas). It is inserted **right after the
canvas** — above the photo/mask/contour, below the crop/straighten gestures.

## Why an SVG with image-px viewBox + non-scaling stroke

`viewBox="0 0 {width} {height}"` (the framed image's intrinsic px) with
`preserveAspectRatio="none"` maps user space onto the displayed rect. Because the canvas preserves
the image aspect via CSS (`max-h/w-full`), the wrapper rect has the *same* aspect as the viewBox,
so `none` introduces no distortion and **square cells in user units stay square on screen**.

Cells: `cell = max(8, round(min(width,height) / 10))` → ~10 cells across the short side, regardless
of orientation. Lines are generated at multiples of `cell`. `vector-effect:non-scaling-stroke`
keeps them ~1 px no matter the on-screen scale (a 1024-px image shown at 500 px would otherwise
draw sub-pixel lines). Stroke is a **light gray** (`#94a3b8`, slate-400) at ~0.6 opacity — a neutral
framing grid that reads on the app's recommended light/uniform background without competing with the
green mask or the red crop/straighten cues. `overflow-hidden rounded-lg` clips the grid to the
canvas's rounded corners.

## Param + plumbing

`showGrid: boolean` joins `Params` (Workspace) next to `showMask`, default `false`. It flows
exactly like the other display params: `ControlsPanel` toggles it via `set('showGrid', v)`;
`OutlinePanel` passes `showGrid={params.showGrid}` into `PhotoOverlay`. Being a `Params` field, it
is captured by the spec-025 history stack and undo/redo for free — consistent with `showMask`.

Display-only: nothing downstream (detection, contour, offset, pocket, CAD, PDF) reads `showGrid`.
