import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { BufferGeometry } from 'three';
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
  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <Canvas camera={{ position: [120, 95, 140], fov: 32 }} dpr={[1, 2]}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[80, 140, 70]} intensity={1.3} />
        <directionalLight position={[-70, 50, -50]} intensity={0.4} />
        {geometry && (
          <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
            {/* depthWrite off while translucent → the mesh doesn't occlude its own interior,
                so the pocket cavity stays visible through the front wall. */}
            <meshStandardMaterial
              color="#3b8ef0"
              roughness={0.5}
              metalness={0.1}
              transparent={translucent}
              opacity={opacity}
              depthWrite={!translucent}
            />
          </mesh>
        )}
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
