// The Ebbryn mark: a line that dips below the baseline and comes back, on a graphite tile.
export function TideMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="6" fill="#27272a" />
      <path d="M5 11h4.5c1.5 0 2 1 2.6 3.2.7 2.7 1.3 3.8 2.4 3.8s1.7-1.1 2.4-3.8C17.5 12 18 11 19.5 11H23" fill="none" stroke="#94faf0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <TideMark />
      <span
        className="font-display text-[22px] leading-none tracking-[-0.9px]"
        style={{ color: inverse ? "#ffffff" : "#18181b" }}
      >
        ebbryn
      </span>
    </span>
  );
}
