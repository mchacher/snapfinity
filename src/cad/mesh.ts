import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Shape3D } from 'replicad';
import { DEFAULT_STL_TOLERANCE_MM } from './export';

/** Convert a replicad shape into a three.js BufferGeometry (vertices / normals / index). */
export function shapeToGeometry(shape: Shape3D, toleranceMm = DEFAULT_STL_TOLERANCE_MM): BufferGeometry {
  const mesh = shape.mesh({ tolerance: toleranceMm });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(mesh.vertices, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(mesh.normals, 3));
  geometry.setIndex(mesh.triangles);
  return geometry;
}
