'use client';

import { useEffect, useState } from 'react';

function format(seconds: number): string {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/** The watch never stops: elapsed time on the floor, ticking since arrival. */
export function CareTicker() {
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((v) => (v ?? 0) + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="care-uptime" aria-hidden="true">
      <span className="care-dot" /> watch active · {elapsed === null ? '––:––:––' : format(elapsed)}
    </p>
  );
}
