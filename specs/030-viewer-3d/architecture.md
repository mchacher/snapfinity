# Architecture 030 — 3D viewer polish

## One module

Everything lives in **`src/features/workspace/Viewer.tsx`** (+ two i18n keys). No new dependency —
`@react-three/drei` (10.7.7) already ships `Grid`, `GizmoHelper`, `GizmoViewcube`, `Bounds`,
`useBounds`, and `Edges`.

## Scene graph

```
<Canvas camera={{ position:[120,95,140], fov:32 }}>
  ambient + 2 directional lights         (unchanged)
  <Grid cellSize=42 sectionSize=210 infiniteGrid .../>   ← ground, y ≈ 0
  {geometry && (
    <Bounds clip>
      <FitController geometry fitRef/>     ← auto-fit + exposes fit() via ref
      <group rotation={[-π/2,0,0]}>        ← base sits at y=0 after rotation
        translucent ? [mesh#bin-back (BackSide), mesh#bin-front (FrontSide)+<Edges/>]
                    : mesh#bin-solid (FrontSide, opaque) + <Edges/>
      </group>
    </Bounds>
  )}
  <OrbitControls makeDefault target={[0,12,0]}/>
  <GizmoHelper alignment="bottom-right"><GizmoViewcube faces={[…localized…]}/></GizmoHelper>
</Canvas>
+ HTML "Ajuster la vue" button (absolute, bottom-left) → fitRef.current()
```

## FitController

`useBounds()` must be called **inside** `<Bounds>`, so the fit logic is a child component, not the
Viewer body. It:
- on mount, stores `() => bounds.refresh().clip().fit()` into `fitRef` (a ref owned by Viewer) so
  the HTML button (outside the Canvas) can trigger a recentre;
- re-runs the fit in an effect keyed on `geometry`, so a rebuilt bin auto-frames.

## Opacity flip — the keyed-material fix

R3F reconciles three-fiber children by position/type. The translucent branch is two meshes; the
opaque branch is one. Without distinct keys R3F **reuses** the first mesh's `meshStandardMaterial`
when the mode flips and only writes the props present in the new JSX — leaving stale
`transparent:true` / `depthWrite:false`, so at opacity 1 the bin renders see-through. Fix:

- distinct keys per branch — `bin-back` / `bin-front` (translucent) vs `bin-solid` (opaque) — so
  the opaque material is a **fresh** fiber;
- every material sets `transparent`, `opacity`, `depthWrite`, `side` **explicitly** (the opaque one
  pins `transparent={false} opacity={1} depthWrite`), so no prop is ever left to a reused default.

The two-pass BackSide→FrontSide translucency (spec 018) is otherwise unchanged.

## i18n

`viewer.fit` ("Ajuster la vue" / "Fit to view") and a nested `viewer.face.{top,bottom,front,back,
left,right}` map (the cube's 6 faces, order `[right,left,top,bottom,front,back]` per
GizmoViewcube's `faces` prop). `t()` already resolves dotted keys, so the nested `face` object
just works.

## Why drei (not hand-rolled)

Grid/Viewcube/Bounds/Edges are all standard drei helpers, already installed — zero new bytes and
no bespoke math. The only custom glue is `FitController` (10 lines) to bridge the in-Canvas
`useBounds` hook to the out-of-Canvas HTML button.
