import { describe, expect, it } from 'vitest';
import { EDIT_ADD, EDIT_ERASE, compositeMask, paintDisc } from './mask-edit';

describe('paintDisc', () => {
  it('stamps a filled disc of the value at the centre', () => {
    const layer = new Uint8Array(11 * 11);
    paintDisc(layer, 11, 11, 5, 5, 3, EDIT_ADD);
    expect(layer[5 * 11 + 5]).toBe(EDIT_ADD); // centre
    expect(layer[5 * 11 + 8]).toBe(EDIT_ADD); // 3px right, on the rim
    expect(layer[0]).toBe(0); // far corner untouched
  });

  it('clips to the image bounds', () => {
    const layer = new Uint8Array(6 * 6);
    expect(() => paintDisc(layer, 6, 6, 0, 0, 4, EDIT_ERASE)).not.toThrow();
    expect(layer[0]).toBe(EDIT_ERASE);
    expect(layer[5 * 6 + 5]).toBe(0); // opposite corner outside the disc
  });
});

describe('compositeMask', () => {
  it('force-on adds, force-off erases, neutral keeps the base', () => {
    const base = new Uint8Array([255, 255, 0, 0]);
    const edit = new Uint8Array([EDIT_ERASE, 0, EDIT_ADD, 0]);
    expect(Array.from(compositeMask(base, edit))).toEqual([0, 255, 255, 0]);
  });

  it('returns the base unchanged when all neutral', () => {
    const base = new Uint8Array([0, 255, 0, 255]);
    expect(Array.from(compositeMask(base, new Uint8Array(4)))).toEqual([0, 255, 0, 255]);
  });
});
