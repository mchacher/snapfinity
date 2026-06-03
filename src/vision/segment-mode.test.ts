import { describe, expect, it } from 'vitest';
import { chooseSegmentMode } from './segment-mode';

// Inputs are (u2netpFrac, edgeFrac, bboxExtentRatio), measured in the BROWSER (onnxruntime-web)
// over the dataset — see the `[auto]` instrumentation in spec 027.
describe('chooseSegmentMode', () => {
  it('switches to edges when u2netp found ~nothing (thin / transparent)', () => {
    expect(chooseSegmentMode(0.0013, 0.029, 24.97)).toBe('edges'); // thin white pen
  });

  it('switches to edges when u2netp missed the object EXTENT (transparent screwdriver tip)', () => {
    // u2netp covers the body (similar AREA to edges) but misses the long thin metal tip → its
    // bbox is much shorter than the edge silhouette's. Area alone would keep u2netp; extent saves it.
    expect(chooseSegmentMode(0.063, 0.061, 1.48)).toBe('edges');
  });

  it('keeps u2netp for opaque objects (u2netp and edges agree in extent)', () => {
    expect(chooseSegmentMode(0.118, 0.151, 1.01)).toBe('standard'); // scissors-white
    expect(chooseSegmentMode(0.204, 0.201, 0.98)).toBe('standard'); // hole-punch
    expect(chooseSegmentMode(1.0, 0.069, 0.13)).toBe('standard'); // fork (u2netp over-covered)
  });

  it('does NOT switch on a textured background even with a big bbox ratio', () => {
    // wood grain blows the edge silhouette past EDGE_MAX → never edges, whatever the bbox ratio
    expect(chooseSegmentMode(0.117, 0.75, 3.29)).toBe('standard'); // scissors-wood
    expect(chooseSegmentMode(0.079, 0.93, 5)).toBe('standard'); // caliper-chrome on wood
  });

  it('respects the boundaries', () => {
    expect(chooseSegmentMode(0.05, 0.1, 1.29)).toBe('standard'); // bbox ratio just under the cut
    expect(chooseSegmentMode(0.05, 0.1, 1.31)).toBe('edges'); // just over → u2netp missed extent
    expect(chooseSegmentMode(0.001, 0.005, 50)).toBe('standard'); // edge blob too small
    expect(chooseSegmentMode(0.001, 0.6, 50)).toBe('standard'); // edge blob too big (background)
  });
});
