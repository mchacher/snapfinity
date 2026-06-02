import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BackSide, FrontSide, type BufferGeometry } from 'three';
import { BusyOverlay } from '../../ui/BusyOverlay';
import { useI18n } from '../../i18n';
import type { BinStatus } from './useBin';

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
  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <Canvas camera={{ position: [120, 95, 140], fov: 32 }} dpr={[1, 2]}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[80, 140, 70]} intensity={1.3} />
        <directionalLight position={[-70, 50, -50]} intensity={0.4} />
        {geometry &&
          (translucent ? (
            // Two-pass transparency for a clean translucent solid: draw the inner (back) faces
            // first, then the outer (front) faces on top. A single transparent pass blends the
            // mesh's own faces in arbitrary triangle order (the "renders badly" artefact); the
            // back→front split sorts them so you cleanly see the pocket through the walls.
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <mesh geometry={geometry} renderOrder={0}>
                <meshStandardMaterial
                  {...matProps}
                  side={BackSide}
                  transparent
                  opacity={opacity}
                  depthWrite={false}
                />
              </mesh>
              <mesh geometry={geometry} renderOrder={1}>
                <meshStandardMaterial
                  {...matProps}
                  side={FrontSide}
                  transparent
                  opacity={opacity}
                  depthWrite={false}
                />
              </mesh>
            </group>
          ) : (
            <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
              <meshStandardMaterial {...matProps} />
            </mesh>
          ))}
        <OrbitControls makeDefault enablePan target={[0, 12, 0]} />
      </Canvas>

      {status === 'loading' && <BusyOverlay label={t('viewer.loading')} />}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-amber-600">{t('viewer.error')}</span>
        </div>
      )}
    </div>
  );
}
