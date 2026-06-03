// Pure détourage-source selection — NO opencv/onnxruntime imports, so it's safe to type-import
// from anywhere and to unit-test without loading WASM (see the spec-026 CI-hang lesson).

export type SegmentMode = 'auto' | 'standard' | 'edges';

// Thresholds backed by **browser** measurements (onnxruntime-web differs a lot from node!) over the
// dataset — see `[auto]` instrumentation in spec 027. Fields: cleaned area / frame, and the ratio
// of the edge silhouette's bounding-box area to u2netp's.
const U2NET_FAIL = 0.025; // u2netp covering < 2.5% of the frame ⇒ it found ~nothing (thin/transparent)
const EDGE_MIN = 0.01; //   the edge silhouette must be a real blob …
const EDGE_MAX = 0.55; //   … but not a textured-background blow-up (wood grain → ef ~0.75–0.93)
const BBOX_RATIO = 1.3; // edges' bbox ≥ 1.3× u2netp's ⇒ u2netp missed the object's EXTENT (e.g. the
//                          thin metal tip of a tester screwdriver: small in area, large in reach)

/**
 * Pick the détourage source. Fall back to **edges** only when the edge silhouette is object-sized
 * (`EDGE_MIN…EDGE_MAX`, so a textured background doesn't trigger it) AND either u2netp **found
 * ~nothing** (`< U2NET_FAIL`) or u2netp **missed the object's extent** (edges' bounding box is
 * much larger — area is a poor signal because a missed thin tip is tiny in area but large in
 * reach). Otherwise keep **u2netp**. `bboxExtentRatio` = edge bbox area / u2netp bbox area. Pure.
 */
export function chooseSegmentMode(u2netpFrac: number, edgeFrac: number, bboxExtentRatio: number): 'standard' | 'edges' {
  if (edgeFrac < EDGE_MIN || edgeFrac > EDGE_MAX) return 'standard'; // edge silhouette implausible / textured
  if (u2netpFrac < U2NET_FAIL || bboxExtentRatio >= BBOX_RATIO) return 'edges';
  return 'standard';
}
