import { describe, expect, it } from 'vitest';
import { add } from './sanity';

describe('sanity (harness check)', () => {
  it('adds two numbers (nominal)', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('handles negative + zero (edge)', () => {
    expect(add(-4, 0)).toBe(-4);
  });
});
