import { Camera, Scan, Box, Download, ShieldCheck, ArrowRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Logo } from '../../ui/Logo';
import { Button } from '../../ui/Button';
import { useI18n, type Lang } from '../../i18n';

const TOKEN_STL = `${import.meta.env.BASE_URL}token/snapfinity-token.stl`;
const TOKEN_STEP = `${import.meta.env.BASE_URL}token/snapfinity-token.step`;
const GITHUB_URL = 'https://github.com/mchacher/snapfinity';

// Faint Gridfinity-style grid behind the hero, faded out toward the edges.
const gridBackdrop: CSSProperties = {
  backgroundImage:
    'linear-gradient(#e8eef6 1px, transparent 1px), linear-gradient(90deg, #e8eef6 1px, transparent 1px)',
  backgroundSize: '42px 42px',
  WebkitMaskImage: 'radial-gradient(ellipse 75% 55% at 50% 0%, #000 35%, transparent 100%)',
  maskImage: 'radial-gradient(ellipse 75% 55% at 50% 0%, #000 35%, transparent 100%)',
};

/** GitHub mark (lucide dropped its brand icons), drawn with currentColor. */
function GithubMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** A small glyph echoing the real calibration token: a disc with a 6-fold ring of holes. */
function TokenGlyph() {
  const holes = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return <circle key={i} cx={16 + Math.cos(a) * 7.5} cy={16 + Math.sin(a) * 7.5} r="1.7" fill="currentColor" />;
  });
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="16" cy="16" r="13" />
      {holes}
      <circle cx="16" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}

/**
 * First-run landing: explains the principle (photo + token → custom Gridfinity bin), the 3 steps,
 * and where to get the calibration token. Shown before the workspace; "Commencer" enters the app.
 */
export function Landing({ onStart }: { onStart: () => void }) {
  const { t, lang, setLang } = useI18n();
  const langs: Lang[] = ['fr', 'en'];
  const steps = [
    { Icon: Camera, title: t('landing.step1Title'), body: t('landing.step1Body') },
    { Icon: Scan, title: t('landing.step2Title'), body: t('landing.step2Body') },
    { Icon: Box, title: t('landing.step3Title'), body: t('landing.step3Body') },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white text-slate-800">
      <header className="sticky top-0 z-10 flex items-center border-b border-slate-100 bg-white/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Logo size={30} className="text-accent-600" />
          <span className="text-base font-semibold tracking-tight text-slate-800">Snapfinity</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-2 py-1 uppercase transition-colors ${
                lang === l ? 'bg-white text-accent-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={gridBackdrop} />
        <div className="relative mx-auto max-w-3xl px-6 pb-16 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
            <ShieldCheck size={13} /> {t('landing.badge')}
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {t('landing.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">{t('landing.subtitle')}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" className="px-5 py-2.5 text-base" icon={<ArrowRight size={18} />} onClick={onStart}>
              {t('landing.start')}
            </Button>
            <a
              href={TOKEN_STL}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Download size={18} /> {t('landing.getToken')}
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t('landing.howTitle')}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {steps.map(({ Icon, title, body }, i) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Icon size={22} />
              </div>
              <div className="mt-4 font-mono text-xs font-semibold text-accent-600">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Calibration token */}
      <section className="mx-auto max-w-5xl px-6 pb-14">
        <div className="flex flex-col items-start gap-5 rounded-2xl border border-accent-200 bg-accent-50 p-7 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-accent-600 shadow-sm">
            <TokenGlyph />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{t('landing.tokenTitle')}</h3>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">{t('landing.tokenBody')}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={TOKEN_STL}
              download
              className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-700"
            >
              <Download size={16} /> {t('landing.tokenStl')}
            </a>
            <a
              href={TOKEN_STEP}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t('landing.tokenStep')}
            </a>
          </div>
        </div>
      </section>

      {/* Privacy + footer */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-10 text-center">
          <ShieldCheck size={22} className="text-accent-600" />
          <h3 className="text-base font-semibold text-slate-900">{t('landing.privacyTitle')}</h3>
          <p className="max-w-md text-sm text-slate-600">{t('landing.privacyBody')}</p>
        </div>
        <footer className="border-t border-slate-200">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-5 text-sm text-slate-500 sm:flex-row">
            <span>
              Snapfinity · {t('landing.openSource')} (GPL-3.0) · {t('landing.madeBy')}
            </span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-slate-900"
            >
              <GithubMark size={16} /> GitHub
            </a>
          </div>
        </footer>
      </section>
    </div>
  );
}
