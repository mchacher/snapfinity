/**
 * Snapfinity mark — a camera inside a Gridfinity bin (the app turns a photo of an object into a
 * grid bin). Drawn with `currentColor` so it inherits the text colour (accent in the header).
 * The faint ticks suggest the grid/bin; the camera = the snap. Single source for header + favicon.
 */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 3.9V6.6M12 17.4V20.1M3.9 12H6.6M17.4 12H20.1" opacity="0.5" />
      <rect x="6.9" y="9.9" width="10.2" height="7" rx="1.5" />
      <path d="M9.6 9.9 10.6 8.2H13.4L14.4 9.9" />
      <circle cx="12" cy="13.4" r="2.1" />
    </svg>
  );
}
