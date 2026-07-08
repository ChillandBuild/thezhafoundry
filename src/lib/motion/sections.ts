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

  // the molten channel fills as the production line is worked
  gsap.to('[data-process-fill]', {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '.process-list',
      start: 'top 70%',
      end: 'bottom 55%',
      scrub: 0.5,
    },
  });

  // section reveals — staggered when several arrive together
  gsap.set('[data-reveal]', { y: 24, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 82%',
    once: true,
    onEnter: (els) =>
      gsap.to(els, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.09 }),
  });

  // the two doors swing open as they arrive
  gsap.utils.toArray<HTMLElement>('[data-door]').forEach((door) => {
    const fromLeft = door.dataset.door === 'left';
    door.classList.add('door-closed');
    gsap.set(door, {
      rotationY: fromLeft ? -26 : 26,
      opacity: 0,
      transformOrigin: fromLeft ? 'left center' : 'right center',
      transformPerspective: 1400,
    });
    ScrollTrigger.create({
      trigger: door,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        gsap.to(door, {
          rotationY: 0,
          opacity: 1,
          duration: 1.1,
          ease: 'power3.out',
          delay: fromLeft ? 0 : 0.15,
          onComplete: () => door.classList.remove('door-closed'),
        });
      },
    });
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

  // reality check — raw material transforms row by row, then the melt line lights
  gsap.set('.reality-table tbody tr', { opacity: 0, y: 16 });
  ScrollTrigger.create({
    trigger: '.reality-table',
    start: 'top 78%',
    once: true,
    onEnter: () => {
      gsap.to('.reality-table tbody tr', {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power2.out',
        stagger: 0.14,
      });
      document.querySelector('.reality-table')?.classList.add('lit');
    },
  });

  // refusals get stamped when they land
  ScrollTrigger.batch('.refusal', {
    start: 'top 78%',
    once: true,
    onEnter: (els) =>
      els.forEach((el, i) => {
        gsap.delayedCall(0.35 + i * 0.22, () => el.classList.add('stamped'));
      }),
  });

  // the standard checks itself, item by item
  ScrollTrigger.create({
    trigger: '.standard-groups',
    start: 'top 72%',
    once: true,
    onEnter: () => {
      gsap.utils.toArray<HTMLElement>('.standard-group li').forEach((li, i) => {
        gsap.delayedCall(0.15 + i * 0.12, () => li.classList.add('checked'));
      });
    },
  });
};
