# Architecture — 008 UI foundation

## Stack additions

- **React** + `@vitejs/plugin-react`; **Tailwind v4** (`@tailwindcss/vite`); **lucide-react**;
  **@fontsource-variable/inter** (self-hosted font, offline).
- Tests for UI: **happy-dom** + **@testing-library/react** (smoke render); i18n parity is a pure test.

## Files

```
index.html                 # entry → /src/main.tsx
src/
  main.tsx                 # React root
  App.tsx                  # workspace composition
  index.css                # @import "tailwindcss" + @theme tokens + base
  ui/                      # design system
    Button.tsx  Panel.tsx  Chip.tsx
    Slider.tsx (slider + number field)  NumberField.tsx  Select.tsx  Toggle.tsx
    index.ts
  i18n/
    en.ts  fr.ts           # dictionaries (identical key shape)
    index.ts               # dict registry + useLang() store + t()
    i18n.test.ts           # key-parity test
  features/workspace/
    Workspace.tsx          # state: pitch/cols/rows/height/thickness/offset/lip + lang/theme
    Header.tsx
    ControlsPanel.tsx      # PHOTO (placeholder + chips) + PARAMÈTRES + EXPORT (disabled stub)
    ViewerPlaceholder.tsx  # "Aperçu 3D" placeholder (real preview = spec 009)
  App.test.tsx             # smoke render
```

## Config

- `vite.config.ts`: `plugins: [react(), tailwindcss()]` (keep the existing `test` block).
- `tsconfig.json`: `"jsx": "react-jsx"`.
- `index.html`: script → `/src/main.tsx`.
- ESLint: tseslint already lints `.tsx`; add `eslint-plugin-react-hooks` if needed.

## Design tokens (in `@theme`)

- Colors: neutral grays (near-white bg, slate text), **accent teal** (`--color-accent-*`),
  semantic (border, muted, surface), warning/success for chips.
- Type: **sans = Inter**, **mono = ui-monospace** stack; numeric values render mono.
- Spacing/radius: small consistent scale; soft radius; hairline borders; subtle shadow.

## i18n

A tiny store: `useLang()` (current `'fr' | 'en'`, setter) + `t(key)` against the active
dictionary. Dictionaries are plain nested objects; `i18n.test.ts` asserts FR and EN have the
**same key set** (recursively). Adding a language = one more dictionary file.

## Risks

- Tailwind v4 + Vite 8 config drift → keep config minimal, verify `build`.
- The viewer is a **placeholder** here; the real replicad→three.js preview (spec 009) is the
  bigger unknown and is de-risked separately.
