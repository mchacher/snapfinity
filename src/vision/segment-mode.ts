// Pure détourage-source selection — NO opencv/onnxruntime imports, so it's safe to type-import
// from anywhere and to unit-test without loading WASM (see the spec-026 CI-hang lesson).

export type SegmentMode = 'auto' | 'standard' | 'edges';

// Auto thresholds, backed by `tools/cv/compare-modes.ts` over the dataset (cleaned area / frame):
//   transparent → u2netp ~0.1–0.3%, edges ~3–5%   |   opaque/textured → u2netp healthy or edges huge.
const U2NET_FAIL = 0.025; // u2netp covering < 2.5% of the frame ⇒ it found ~nothing (transparent)
const EDGE_MIN = 0.01; //   the edge silhouette must be a real blob …
const EDGE_MAX = 0.55; //   … but not a textured-background blow-up (wood grain → ~74–93%)

/**
 * Pick the détourage source. Conservative on purpose: only fall back to **edges** when u2netp
 * **clearly failed** (tiny coverage) **and** the edge silhouette is object-sized (not a
 * textured-background blow-up). Otherwise keep **u2netp**. Inputs are cleaned-mask area fractions
 * of the frame. Pure → unit-testable.
 */
export function chooseSegmentMode(u2netpFrac: number, edgeFrac: number): 'standard' | 'edges' {
  if (u2netpFrac < U2NET_FAIL && edgeFrac >= EDGE_MIN && edgeFrac <= EDGE_MAX) return 'edges';
  return 'standard';
}
