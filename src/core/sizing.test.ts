import { describe, expect, it } from 'vitest';
import { HEIGHT_UNIT_MM, PITCH, footprintFromBBox, gridFootprint, heightUnits, unitsForLength } from './sizing';

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

describe('footprintFromBBox', () => {
  it('converts a pixel bbox to a grid footprint via the scale', () => {
    // 0.2 mm/px → 420px×210px ≈ 84mm×42mm → 2×1 at pitch 42
    expect(footprintFromBBox({ w: 420, h: 210 }, 0.2, PITCH.standard)).toEqual({ cols: 2, rows: 1 });
  });

  it('rounds up via gridFootprint (ceil)', () => {
    // 421px×0.2 = 84.2mm → 3 cols
    expect(footprintFromBBox({ w: 421, h: 210 }, 0.2, PITCH.standard)).toEqual({ cols: 3, rows: 1 });
  });

  it('returns null when there is no scale', () => {
    expect(footprintFromBBox({ w: 420, h: 210 }, null, PITCH.standard)).toBeNull();
    expect(footprintFromBBox({ w: 420, h: 210 }, 0, PITCH.standard)).toBeNull();
  });

  it('returns null for an empty bbox', () => {
    expect(footprintFromBBox({ w: 0, h: 0 }, 0.2, PITCH.standard)).toBeNull();
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
