import { createContext, useContext, useState, type ReactNode } from 'react';
import { en, type Dict } from './en';
import { fr } from './fr';

export type Lang = 'fr' | 'en';

export const dictionaries: Record<Lang, Dict> = { en, fr };

/** Resolve a dotted key (e.g. "params.pitch") against a dictionary. */
function resolve(dict: Dict, path: string): string {
  const value = path
    .split('.')
    .reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], dict);
  return typeof value === 'string' ? value : path;
}

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');
  const t = (key: string): string => resolve(dictionaries[lang], key);
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
