/**
 * PROPOSAL (landing hero): a before/after where the "after" is a **real 3D render** of the Gridfinity
 * bin the tool produces, rendered by the app itself and captured as a static image (the landing stays
 * light — no live three.js / WASM). The "before" is the object photo + the real calibration token
 * (recoloured to the brand blue via an inverted-luminance SVG mask of `token-ref.jpg`). Behind the
 * `?hero=3d` toggle while we decide vs the flat illustration (HeroVisual).
 */
import { ArrowRight } from 'lucide-react';

const AIRPODS_IMG = `${import.meta.env.BASE_URL}hero-airpods.png`;
const BIN_IMG = `${import.meta.env.BASE_URL}hero-airpods-bin.png`;
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
      <div className="relative w-2/5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        <span className="absolute left-4 top-3 z-10 text-[10px] font-semibold tracking-wide text-slate-400">
          {photoLabel}
        </span>
        {/* the object + token laid on an A4 sheet (the calibration scene) */}
        <div
          className="absolute left-1/2 top-1/2 flex w-[88%] items-center justify-center gap-3 rounded-[2px] bg-white shadow-md ring-1 ring-black/5"
          style={{ aspectRatio: '1.414', transform: 'translate(-50%, -50%) rotate(-4deg)' }}
        >
          <img src={AIRPODS_IMG} alt="AirPods case" className="h-[56%] w-auto" />
          {/* the real Snapfinity token, recoloured blue (invert its black-on-white ref into a mask) */}
          <svg viewBox="0 0 100 100" aria-hidden="true" className="h-[48%] w-auto">
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
