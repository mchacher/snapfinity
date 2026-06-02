/**
 * A "computing" pill centred over the work area. The spinner is a plain bordered circle rotated
 * with `animate-spin` **and `will-change-transform`** — the latter promotes it to its own
 * compositor layer, so the rotation runs on the compositor thread and keeps turning even while
 * the main thread is blocked by a heavy WASM compute (u2netp / replicad). A lucide SVG icon is
 * not layer-promoted, so its animation freezes during the block. Drop this inside a `relative`
 * container over the photo or the 3D view.
 */
export function BusyOverlay({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <span className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/85 px-4 py-2.5 shadow-md backdrop-blur">
        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600 [will-change:transform]" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </span>
    </div>
  );
}
