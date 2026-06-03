import type { Point2D } from '../core/offset';
import type { BinParams } from './bin';

/**
 * Shared message contract between the main thread (`cad-client.ts`) and the CAD worker
 * (`cad.worker.ts`). Type-only imports (`BinParams`, `Point2D`) are erased at build time, so
 * importing this module on the main thread pulls **no replicad** into the main bundle.
 */

/** Triangle mesh as transferable typed arrays (worker → main → three.js BufferGeometry). */
export interface MeshArrays {
  positions: Float32Array;
  normals: Float32Array;
  index: Uint32Array;
}

export type ExportFormat = 'stl' | 'step';

/** Vertical pinch-grip config: a symmetric pair of finger scoops at the object's edge. */
export interface NotchConfig {
  enabled: boolean;
  /** Finger-scoop radius in mm. */
  radiusMm: number;
  /** Symmetric X offset from the object edge, mm (widens/narrows the pair). */
  offsetXMm: number;
  /** Y offset along the depth, mm (0 = object mid-depth). */
  offsetYMm: number;
}

/** main → worker. Each request carries an `id`; the reply echoes it. */
export type WorkerRequest =
  | {
      type: 'build';
      id: number;
      binParams: BinParams;
      footprint: Point2D[] | null;
      depthMm: number;
      notch: NotchConfig;
    }
  | { type: 'export'; id: number; format: ExportFormat };

/** worker → main. `built` transfers the array buffers; `exported` clones the Blob. */
export type WorkerResponse =
  | ({ type: 'built'; id: number } & MeshArrays)
  | { type: 'exported'; id: number; blob: Blob }
  | { type: 'error'; id: number; message: string };
