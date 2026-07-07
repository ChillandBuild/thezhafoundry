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

      const removers: Array<() => void> = [];

      const ctx = gsap.context(() => {
        // hero entrance — one orchestrated pour on load
        const entrance = gsap.timeline({ defaults: { ease: 'power3.out' } });
        entrance
          .from('.hero-readout', { y: 14, opacity: 0, duration: 0.5 })
          .from('.hero-line', { y: 46, opacity: 0, duration: 0.8, stagger: 0.14 }, '-=0.2')
          .from('.hero-sub', { y: 18, opacity: 0, duration: 0.6 }, '-=0.45')
          .from('.hero-mark', { scale: 0.9, opacity: 0, duration: 0.9, ease: 'power2.out' }, '-=0.6');

        // pour-temp readout counts up to copper's melting point
        const temp = document.querySelector('.temp-value');
        if (temp) {
          const counter = { v: 24 };
          entrance.to(
            counter,
            {
              v: 1084.6,
              duration: 1.4,
              ease: 'power2.inOut',
              onUpdate: () => {
                temp.textContent = counter.v.toLocaleString('en-US', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                });
              },
            },
            0.3,
          );
        }

        // pour seam scrubbed to scroll progress, molten tip riding the pour front
        gsap.to('[data-seam]', {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 0.6 },
        });
        gsap.fromTo(
          '[data-seam-tip]',
          { y: -20 },
          {
            y: () => window.innerHeight - 7,
            ease: 'none',
            scrollTrigger: {
              trigger: 'main',
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );

        // process stages ignite as they pass
        gsap.utils.toArray<HTMLElement>('[data-ignite]').forEach((el) => {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 70%',
            toggleClass: { targets: el, className: 'lit' },
            once: true,
          });
        });

        // section reveals — staggered when several arrive together
        gsap.set('[data-reveal]', { y: 24, opacity: 0 });
        ScrollTrigger.batch('[data-reveal]', {
          start: 'top 82%',
          once: true,
          onEnter: (els) =>
            gsap.to(els, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.09 }),
        });

        // reality check — raw material transforms row by row
        gsap.set('.reality-table tbody tr', { opacity: 0, y: 16 });
        ScrollTrigger.create({
          trigger: '.reality-table',
          start: 'top 78%',
          once: true,
          onEnter: () =>
            gsap.to('.reality-table tbody tr', {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: 'power2.out',
              stagger: 0.14,
            }),
        });

        // magnetic pull on solid CTAs
        gsap.utils.toArray<HTMLElement>('.btn:not(.btn-ghost)').forEach((btn) => {
          const xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
          const yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });
          const onMove = (e: MouseEvent) => {
            const r = btn.getBoundingClientRect();
            xTo((e.clientX - (r.left + r.width / 2)) * 0.18);
            yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
          };
          const onLeave = () => {
            xTo(0);
            yTo(0);
          };
          btn.addEventListener('mousemove', onMove);
          btn.addEventListener('mouseleave', onLeave);
          removers.push(() => {
            btn.removeEventListener('mousemove', onMove);
            btn.removeEventListener('mouseleave', onLeave);
          });
        });
      });

      cleanup = () => {
        removers.forEach((remove) => remove());
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
