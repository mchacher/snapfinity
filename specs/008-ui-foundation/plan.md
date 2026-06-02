# Plan — 008 UI foundation

## Steps

1. Wire React + Tailwind into Vite (plugins, tsconfig jsx, index.html → main.tsx).
2. `index.css`: tailwind import + `@theme` tokens (light, teal accent, fonts) + base.
3. i18n: `en.ts`, `fr.ts`, `index.ts` (store + `t`), `i18n.test.ts` (key parity).
4. Base components: Button, Panel, Chip, NumberField, Slider, Select, Toggle.
5. Shell: Header, ControlsPanel (Photo placeholder + chips + Paramètres + Export stub), ViewerPlaceholder, Workspace.
6. `App.test.tsx` smoke render (happy-dom).
7. Validate (typecheck/lint/test/build); screenshot via Playwright for visual review.

## Task breakdown

- [ ] React + Tailwind scaffold builds
- [ ] tokens + base components
- [ ] shell laid out (header / panel / viewer placeholder)
- [ ] i18n FR/EN + parity test
- [ ] App smoke test
- [ ] four checks green
- [ ] screenshot produced + user visual OK
- [ ] PR + CI green

## Test plan

| Module | Scenario | Expected |
| ------ | -------- | -------- |
| i18n | FR and EN key sets | identical (recursive) — missing key fails |
| i18n | `t('header.export')` for `en`/`fr` | returns the right string |
| App  | mounts in happy-dom | renders header + panel + viewer, no crash |

**Visual (manual):** screenshot of desktop shell reviewed by the user — clean, light,
teal accent, mono numbers, viewer-as-hero. Mobile layout sanity-checked.

Interaction logic (param clamping, preview updates) is tested in spec 009 when it drives the
real preview; here controls are presentational/state-only.
