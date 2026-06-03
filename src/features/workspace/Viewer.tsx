import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewcube, Bounds, useBounds, Edges } from '@react-three/drei';
import { BackSide, FrontSide, type BufferGeometry } from 'three';
import { useEffect, useRef, type MutableRefObject } from 'react';
import { Maximize2 } from 'lucide-react';
import { BusyOverlay } from '../../ui/BusyOverlay';
import { useI18n } from '../../i18n';
import type { BinStatus } from './useBin';

const EDGE_COLOR = '#1e3a5f';

/**
 * Auto-fits the camera to the bin whenever the geometry changes, and exposes a
 * `fit()` callback (via `fitRef`) so the on-screen "Fit to view" button can recentre.
 */
function FitController({
  geometry,
  fitRef,
}: {
  geometry: BufferGeometry;
  fitRef: MutableRefObject<(() => void) | null>;
}) {
  const bounds = useBounds();
  useEffect(() => {
    fitRef.current = () => bounds.refresh().clip().fit();
  }, [bounds, fitRef]);
  useEffect(() => {
    bounds.refresh().clip().fit();
  }, [geometry, bounds]);
  return null;
}

export function Viewer({
  geometry,
  status,
  opacity = 1,
}: {
  geometry: BufferGeometry | null;
  status: BinStatus;
  /** Render opacity 0.2…1. Below 1 the bin turns translucent so the pocket shows through. */
  opacity?: number;
}) {
  const { t } = useI18n();
  const translucent = opacity < 1;
  const matProps = { color: '#3b8ef0', roughness: 0.5, metalness: 0.1 } as const;
  const fitRef = useRef<(() => void) | null>(null);
  // Visible edges on the bin — drei's <Edges> overlays the geometry's hard edges (threshold in
  // degrees) like the contour lines in gridfinity-generator's preview.
  const edges = <Edges threshold={20} color={EDGE_COLOR} />;

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <Canvas camera={{ position: [120, 95, 140], fov: 32 }} dpr={[1, 2]}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[80, 140, 70]} intensity={1.3} />
        <directionalLight position={[-70, 50, -50]} intensity={0.4} />
        {/* Ground grid: cellSize 42 mm = one Gridfinity unit; sections every 5 cells. */}
        <Grid
          position={[0, -0.5, 0]}
          infiniteGrid
          cellSize={42}
          cellThickness={1}
          cellColor="#cbd5e1"
          sectionSize={210}
          sectionThickness={1.3}
          sectionColor="#94a3b8"
          fadeDistance={900}
          fadeStrength={1.2}
          followCamera={false}
        />
        {geometry && (
          <Bounds clip>
            <FitController geometry={geometry} fitRef={fitRef} />
            <group rotation={[-Math.PI / 2, 0, 0]}>
              {translucent ? (
                // Two-pass transparency for a clean translucent solid: draw the inner (back) faces
                // first, then the outer (front) faces on top. A single transparent pass blends the
                // mesh's own faces in arbitrary triangle order (the "renders badly" artefact); the
                // back→front split sorts them so you cleanly see the pocket through the walls.
                // Distinct keys (vs the opaque branch) force a fresh material when the mode flips —
                // otherwise R3F reuses the mesh/material fiber and the stale `transparent`/
                // `depthWrite:false` linger, leaving the bin see-through at opacity 1.
                <>
                  <mesh key="bin-back" geometry={geometry} renderOrder={0}>
                    <meshStandardMaterial {...matProps} side={BackSide} transparent opacity={opacity} depthWrite={false} />
                  </mesh>
                  <mesh key="bin-front" geometry={geometry} renderOrder={1}>
                    <meshStandardMaterial {...matProps} side={FrontSide} transparent opacity={opacity} depthWrite={false} />
                    {edges}
                  </mesh>
                </>
              ) : (
                <mesh key="bin-solid" geometry={geometry}>
                  <meshStandardMaterial {...matProps} side={FrontSide} transparent={false} opacity={1} depthWrite />
                  {edges}
                </mesh>
              )}
            </group>
          </Bounds>
        )}
        <OrbitControls makeDefault enablePan target={[0, 12, 0]} />
        {/* Orientation cube (top/right/bottom… faces) — click a face to snap the view. */}
        <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
          <GizmoViewcube
            color="#ffffff"
            textColor="#334155"
            strokeColor="#cbd5e1"
            hoverColor="#3b8ef0"
            faces={[t('viewer.face.right'), t('viewer.face.left'), t('viewer.face.top'), t('viewer.face.bottom'), t('viewer.face.front'), t('viewer.face.back')]}
          />
        </GizmoHelper>
      </Canvas>

      {geometry && status === 'ready' && (
        <button
          type="button"
          onClick={() => fitRef.current?.()}
          title={t('viewer.fit')}
          aria-label={t('viewer.fit')}
          className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <Maximize2 size={14} /> {t('viewer.fit')}
        </button>
      )}
      {status === 'loading' && <BusyOverlay label={t('viewer.loading')} />}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-amber-600">{t('viewer.error')}</span>
        </div>
      )}
    </div>
  );
}
