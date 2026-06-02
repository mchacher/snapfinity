import type { Shape3D } from 'replicad';

/** Default STL mesh tolerance (mm): light files, smooth to the eye and the printer. */
export const DEFAULT_STL_TOLERANCE_MM = 0.05;

export interface StlOptions {
  /** Linear mesh tolerance in mm (smaller = finer + heavier). */
  toleranceMm?: number;
  /** Binary STL (default true) — far smaller than ASCII, universally supported. */
  binary?: boolean;
}

/** Export a shape to an STL Blob with a sensible default mesh tolerance. */
export function shapeToStl(shape: Shape3D, options: StlOptions = {}): Blob {
  const { toleranceMm = DEFAULT_STL_TOLERANCE_MM, binary = true } = options;
  return shape.blobSTL({ tolerance: toleranceMm, binary });
}
