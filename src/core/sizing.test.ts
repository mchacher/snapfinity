import { describe, expect, it } from 'vitest';
import {
  BIN_INNER_MARGIN_MM,
  HEIGHT_UNIT_MM,
  PITCH,
  gridForFootprint,
  gridFootprint,
  heightUnits,
  unitsForLength,
} from './sizing';

describe('constants', () => {
  it('exposes the Gridfinity constants', () => {
    expect(PITCH.standard).toBe(42);
    expect(PITCH.compact).toBe(36);
    expect(HEIGHT_UNIT_MM).toBe(7);
  });
});

describe('unitsForLength', () => {
  it('counts cells with ceil', () => {
    expect(unitsForLength(130, PITCH.standard)).toBe(4);
  });

  it('does not over-count on an exact multiple', () => {
    expect(unitsForLength(42, 42)).toBe(1);
    expect(unitsForLength(84, 42)).toBe(2);
  });

  it('rounds a hair over a multiple up', () => {
    expect(unitsForLength(42.01, 42)).toBe(2);
  });

  it('supports the compact 36 mm pitch', () => {
    expect(unitsForLength(50, PITCH.compact)).toBe(2);
  });

  it('clamps a zero length to one cell', () => {
    expect(unitsForLength(0, 42)).toBe(1);
  });

  it('throws on a negative length or a non-positive pitch', () => {
    expect(() => unitsForLength(-5, 42)).toThrow();
    expect(() => unitsForLength(50, 0)).toThrow();
    expect(() => unitsForLength(50, -42)).toThrow();
  });
});

describe('gridFootprint', () => {
  it('returns cols × rows for a bounding box', () => {
    expect(gridFootprint(130, 80, PITCH.standard)).toEqual({ cols: 4, rows: 2 });
  });
});

describe('gridForFootprint', () => {
  it('sizes for the interior: a pocket just under the pitch still needs the inner margin', () => {
    // 80 mm pocket + 2.9 margin = 82.9 → fits 2 cols (84-0.5 outer); a bare 80/42 would say 2 too,
    // but 82mm: 82+2.9=84.9 > 84 → bumps to 3, where bare 82/42 = 2 (the bug we fix).
    expect(gridForFootprint(82, 30, PITCH.standard)).toEqual({ cols: 3, rows: 1 });
    expect(gridFootprint(82, 30, PITCH.standard)).toEqual({ cols: 2, rows: 1 }); // old (hors-tout) under-sizes
  });

  it('exposes a sensible inner margin (gap + 2 walls)', () => {
    expect(BIN_INNER_MARGIN_MM).toBeCloseTo(2.9, 9);
  });

  it('returns null for an empty footprint', () => {
    expect(gridForFootprint(0, 0, PITCH.standard)).toBeNull();
  });
});

describe('heightUnits', () => {
  it('counts 7 mm increments with ceil', () => {
    expect(heightUnits(14)).toBe(2);
    expect(heightUnits(15)).toBe(3);
  });

  it('clamps zero to one and throws on negative', () => {
    expect(heightUnits(0)).toBe(1);
    expect(() => heightUnits(-1)).toThrow();
  });
});
