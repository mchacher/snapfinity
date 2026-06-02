import type { Shape3D } from 'replicad';
import { DEFAULT_STL_TOLERANCE_MM } from './export';
import type { MeshArrays } from './cad-messages';

/**
 * Mesh a replicad shape into transferable typed arrays (positions / normals / index). Runs in
 * the CAD worker; the buffers are transferred (zero-copy) to the main thread, which rebuilds a
 * three.js BufferGeometry via `arraysToGeometry`. Replicad-only (no three.js) so the worker
 * bundle stays lean.
 */
export function meshToArrays(shape: Shape3D, toleranceMm = DEFAULT_STL_TOLERANCE_MM): MeshArrays {
  const mesh = shape.mesh({ tolerance: toleranceMm });
  return {
    positions: new Float32Array(mesh.vertices),
    normals: new Float32Array(mesh.normals),
    index: new Uint32Array(mesh.triangles),
  };
}
