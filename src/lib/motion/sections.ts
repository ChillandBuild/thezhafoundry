import { decode } from './decode';
import type { Effect } from './types';

/** Shared scroll choreography: reveals, ignitions, runners, readout decodes. */
export const sections: Effect = ({ gsap, ScrollTrigger }) => {
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

  // seam runners branch into each section label; the label decodes as it lights
  gsap.utils.toArray<HTMLElement>('.eyebrow').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        el.classList.add('runner-lit');
        decode(gsap, el, 0.55);
      },
    });
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
};
