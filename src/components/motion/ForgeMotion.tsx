'use client';

import { useEffect } from 'react';

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

      const ctx = gsap.context(() => {
        gsap.to('[data-seam]', {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 0.6 },
        });

        gsap.utils.toArray<HTMLElement>('[data-ignite]').forEach((el) => {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 70%',
            toggleClass: { targets: el, className: 'lit' },
            once: true,
          });
        });

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.fromTo(
            el,
            { y: 24, opacity: 0 },
            {
              y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 82%', once: true },
            },
          );
        });
      });

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
