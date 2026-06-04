/**
 * PROPOSAL (landing hero): a before/after where the "after" is a **real 3D render** of the Gridfinity
 * bin the tool produces, rendered by the app itself and captured as a static image (the landing stays
 * light — no live three.js / WASM). The "before" is the object photo + the real calibration token
 * (recoloured to the brand blue via an inverted-luminance SVG mask of `token-ref.jpg`). Behind the
 * `?hero=3d` toggle while we decide vs the flat illustration (HeroVisual).
 */
import { ArrowRight } from 'lucide-react';

const CALIPER_IMG = `${import.meta.env.BASE_URL}hero-caliper.jpg`;
const BIN_IMG = `${import.meta.env.BASE_URL}hero-bin-3d.png`;
const TOKEN_REF = `${import.meta.env.BASE_URL}token-ref.jpg`;

export function HeroVisual3D({
  className,
  photoLabel,
  binLabel,
}: {
  className?: string;
  photoLabel: string;
  binLabel: string;
}) {
  return (
    <div className={`flex items-stretch justify-center gap-2 sm:gap-4 ${className ?? ''}`}>
      {/* before — the object photo + the (blue) calibration token */}
      <div className="relative w-2/5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <span className="absolute left-4 top-3 z-10 text-[10px] font-semibold tracking-wide text-slate-400">
          {photoLabel}
        </span>
        <img
          src={CALIPER_IMG}
          alt="digital caliper"
          className="absolute left-1/2 top-1/2 h-[94%] w-auto max-w-none"
          style={{ transform: 'translate(-50%, -50%) rotate(33deg)' }}
        />
        {/* the real Snapfinity token, recoloured blue (invert its black-on-white ref into a mask) */}
        <svg className="absolute bottom-5 right-5 z-10 h-14 w-14" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <filter id="hv-tok-inv">
              <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" />
            </filter>
            <mask id="hv-tok-mask">
              <image href={TOKEN_REF} width="100" height="100" preserveAspectRatio="xMidYMid meet" filter="url(#hv-tok-inv)" />
            </mask>
          </defs>
          <rect width="100" height="100" fill="#3b8ef0" mask="url(#hv-tok-mask)" />
        </svg>
      </div>

      {/* arrow */}
      <div className="flex shrink-0 items-center text-accent-300">
        <ArrowRight size={26} />
      </div>

      {/* after — a real 3D render of the bin the tool builds */}
      <div className="relative flex w-3/5 items-center overflow-hidden rounded-2xl border border-accent-200 bg-accent-50 shadow-sm">
        <span className="absolute left-4 top-3 z-10 text-[10px] font-semibold tracking-wide text-accent-500">
          {binLabel}
        </span>
        <img src={BIN_IMG} alt="3D Gridfinity bin with a pocket shaped like the object" className="w-full" />
      </div>
    </div>
  );
}
