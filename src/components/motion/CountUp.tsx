"use client";

import { useEffect, useRef, useState } from "react";

// Tweens a number to its new value so the idle cash figure rolls instead of jumping.
export function CountUp({ value, format, ms = 700 }: { value: number; format: (n: number) => string; ms?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    // Reduced motion jumps straight to the value on the next frame.
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = dur ? Math.min(1, (t - start) / dur) : 1;
      const eased = 1 - Math.pow(1 - k, 3);
      const n = a + (value - a) * eased;
      from.current = n;
      setShown(n);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);

  return <>{format(shown)}</>;
}
