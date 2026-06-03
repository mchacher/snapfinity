import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, initHistory, record, redo, undo } from './history';

describe('history', () => {
  it('starts empty (no undo/redo)', () => {
    const h = initHistory('a');
    expect(h.present).toBe('a');
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it('records: present → past, clears redo', () => {
    let h = initHistory('a');
    h = record(h, 'b');
    expect(h).toMatchObject({ past: ['a'], present: 'b', future: [] });
    expect(canUndo(h)).toBe(true);
  });

  it('undo / redo walk across the timeline', () => {
    let h = record(record(initHistory('a'), 'b'), 'c'); // a → b → c
    h = undo(h);
    expect(h.present).toBe('b');
    expect(canRedo(h)).toBe(true);
    h = undo(h);
    expect(h.present).toBe('a');
    expect(canUndo(h)).toBe(false);
    h = redo(h);
    expect(h.present).toBe('b');
    h = redo(h);
    expect(h.present).toBe('c');
    expect(canRedo(h)).toBe(false);
  });

  it('undo / redo are no-ops at the ends', () => {
    const h = initHistory('a');
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  it('recording after an undo clears the redo branch', () => {
    let h = record(record(initHistory('a'), 'b'), 'c'); // a → b → c
    h = undo(h); // present b, future [c]
    h = record(h, 'd'); // new branch
    expect(h.present).toBe('d');
    expect(canRedo(h)).toBe(false);
    expect(h.past).toEqual(['a', 'b']);
  });

  it('caps the depth, dropping the oldest', () => {
    let h = initHistory(0);
    for (let i = 1; i <= 5; i += 1) h = record(h, i, 3); // limit 3
    // past holds at most 3 entries; the oldest were dropped
    expect(h.past.length).toBeLessThanOrEqual(3);
    expect(h.present).toBe(5);
    expect(h.past[h.past.length - 1]).toBe(4);
  });
});
