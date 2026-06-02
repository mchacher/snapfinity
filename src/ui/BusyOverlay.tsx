import { Loader2 } from 'lucide-react';

/**
 * A "computing" pill centred over the work area. The spinner animates via `transform` (rotate),
 * which runs on the compositor thread — so it keeps turning even while the main thread is
 * blocked by a heavy WASM compute (u2netp / replicad). Absolutely positioned: drop it inside a
 * `relative` container over the photo or the 3D view.
 */
export function BusyOverlay({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <span className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/85 px-4 py-2.5 shadow-md backdrop-blur">
        <Loader2 size={18} className="animate-spin text-accent-600" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </span>
    </div>
  );
}
