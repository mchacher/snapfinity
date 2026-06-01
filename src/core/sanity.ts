/**
 * Harness placeholder — its only purpose is to prove the test pipeline runs.
 * Removed in iteration 1, when the real calibration/sizing logic lands in `core/`.
 *
 * `core/` holds PURE logic only: no WASM, no DOM — fully unit-testable.
 */
export function add(a: number, b: number): number {
  return a + b;
}
