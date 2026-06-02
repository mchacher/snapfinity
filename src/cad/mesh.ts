import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } from 'three';
import type { Shape3D } from 'replicad';
import { DEFAULT_STL_TOLERANCE_MM } from './export';
import type { MeshArrays } from './cad-messages';

/** Convert a replicad shape into a three.js BufferGeometry (vertices / normals / index). */
export function shapeToGeometry(shape: Shape3D, toleranceMm = DEFAULT_STL_TOLERANCE_MM): BufferGeometry {
  const mesh = shape.mesh({ tolerance: toleranceMm });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(mesh.vertices, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(mesh.normals, 3));
  geometry.setIndex(mesh.triangles);
  return geometry;
}

/**
 * Rebuild a three.js BufferGeometry from the raw mesh arrays produced by the CAD worker
 * (`meshToArrays`). Main-thread, three-only (no replicad) — this is what the worker path uses
 * instead of `shapeToGeometry`, since the shape itself never leaves the worker.
 */
export function arraysToGeometry({ positions, normals, index }: MeshArrays): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(new Uint32BufferAttribute(index, 1));
  return geometry;
}
