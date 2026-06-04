/**
 * Hero illustration: the Snapfinity promise in one picture — a photographed object (+ the calibration
 * token) becomes a Gridfinity bin with a pocket of the exact same shape. Pure SVG (no assets), uses
 * the brand accent. The SAME wrench path appears as the object's outline (left) and as the bin's
 * pocket (right), so the "matched to your object" idea reads at a glance.
 */

// lucide "Wrench" path (ISC) — reused as both the object outline and the matching pocket.
const WRENCH =
  'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z';

function TokenDisc({ x, y, r = 15 }: { x: number; y: number; r?: number }) {
  const holes = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return <circle key={i} cx={x + Math.cos(a) * (r * 0.55)} cy={y + Math.sin(a) * (r * 0.55)} r={r * 0.12} fill="#3b8ef0" />;
  });
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#e6f0fd" stroke="#3b8ef0" strokeWidth="2" />
      {holes}
      <circle cx={x} cy={y} r={r * 0.16} fill="#3b8ef0" />
    </g>
  );
}

export function HeroVisual({
  className,
  photoLabel,
  binLabel,
}: {
  className?: string;
  photoLabel: string;
  binLabel: string;
}) {
  return (
    <svg
      viewBox="0 0 480 248"
      className={className}
      role="img"
      aria-label="A photographed object becomes a Gridfinity bin with a pocket of the same shape"
    >
      <defs>
        <filter id="hv-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#1e293b" floodOpacity="0.10" />
        </filter>
      </defs>

      {/* ── Photo tile: the object + the calibration token ───────────────────────── */}
      <g filter="url(#hv-shadow)">
        <rect x="12" y="34" width="186" height="180" rx="18" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
      </g>
      <text x="30" y="60" fontSize="11" fontWeight="600" fill="#94a3b8" letterSpacing="0.8">{photoLabel}</text>
      <g transform="translate(96 132) rotate(-20) scale(3.5) translate(-12 -12)">
        <path d={WRENCH} fill="none" stroke="#94a3b8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <TokenDisc x={162} y={180} />

      {/* ── Arrow ────────────────────────────────────────────────────────────────── */}
      <g stroke="#3b8ef0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M214 124 H258" />
        <path d="M249 116 l10 8 l-10 8" />
      </g>

      {/* ── Bin tile: a Gridfinity bin with a pocket of the same shape ─────────────── */}
      <g filter="url(#hv-shadow)">
        <rect x="282" y="34" width="186" height="180" rx="18" fill="#f2f7fe" stroke="#cce0fb" strokeWidth="2" />
      </g>
      <text x="300" y="60" fontSize="11" fontWeight="600" fill="#7cb1f5" letterSpacing="0.8">{binLabel}</text>
      {/* faint Gridfinity grid */}
      <g stroke="#cce0fb" strokeWidth="1.4">
        <path d="M282 110 H468 M282 154 H468 M328 70 V214 M375 70 V214 M422 70 V214" opacity="0.75" />
      </g>
      {/* pocket (same wrench, recessed) — a soft depth copy under a filled cavity */}
      <g transform="translate(378 132) rotate(-20) scale(3.5) translate(-12 -12)">
        <path d={WRENCH} fill="#a6cbf9" transform="translate(0.6 0.6)" />
        <path d={WRENCH} fill="#cce0fb" stroke="#3b8ef0" strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
