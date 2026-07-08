'use client';

import { useEffect } from 'react';
import type { Effect } from '../../lib/motion/types';
import { entrance } from '../../lib/motion/entrance';
import { seam } from '../../lib/motion/seam';
import { temperature } from '../../lib/motion/temperature';
import { sections } from '../../lib/motion/sections';
import { magnetic } from '../../lib/motion/magnetic';

const EFFECTS: Effect[] = [entrance, seam, temperature, sections, magnetic];

/** Single mount point for all GSAP choreography — one dynamic import, one context. */
export function ForgeMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const extraCleanups: Array<() => void> = [];
      const ctx = gsap.context(() => {
        for (const effect of EFFECTS) {
          const dispose = effect({ gsap, ScrollTrigger });
          if (dispose) extraCleanups.push(dispose);
        }
      });

      cleanup = () => {
        extraCleanups.forEach((dispose) => dispose());
        ctx.revert();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
