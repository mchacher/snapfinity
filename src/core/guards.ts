/**
 * Input guards for `core/` math. Pure, framework-free, throw on invalid input.
 */

/** Throws unless `value` is a finite number strictly greater than 0. */
export function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number, got ${value}`);
  }
}

/** Throws unless `value` is a finite number greater than or equal to 0. */
export function assertNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative finite number, got ${value}`);
  }
}
