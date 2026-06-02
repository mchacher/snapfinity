import { describe, expect, it } from 'vitest';
import { en } from './en';
import { fr } from './fr';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

function valueAt(dict: object, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], dict);
}

describe('i18n', () => {
  it('FR and EN expose the same set of keys', () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort());
  });

  it('every key resolves to a non-empty string in both languages', () => {
    for (const dict of [en, fr]) {
      for (const k of keys(dict)) {
        const value = valueAt(dict, k);
        expect(typeof value === 'string' && value.length > 0).toBe(true);
      }
    }
  });
});
