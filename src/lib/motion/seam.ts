import type { Effect } from './types';

const DRIP_COUNT = 3;

/**
 * The pour seam: molten line scrubbed to scroll, a flaring tip riding the
 * pour front, and drips that fall from the tip while the metal travels.
 */
export const seam: Effect = ({ gsap }) => {
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

  // drips shed from the pour front — only where the seam is shown at all
  if (!window.matchMedia('(min-width: 1241px)').matches) return;
  const tip = document.querySelector<HTMLElement>('[data-seam-tip]');
  const drips = gsap.utils.toArray<HTMLElement>('.seam-drip').slice(0, DRIP_COUNT);
  if (!tip || drips.length === 0) return;

  const tweens = drips.map((drip, i) =>
    gsap.fromTo(
      drip,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.01,
        repeat: -1,
        repeatDelay: 1.1 + i * 0.9,
        delay: i * 1.3,
        onRepeat: () => {
          const y = tip.getBoundingClientRect().top;
          if (y < 40) return; // still parked at the top — nothing to shed
          gsap.fromTo(
            drip,
            { y, opacity: 0.95, scaleY: 1 },
            { y: y + 90 + Math.random() * 70, opacity: 0, scaleY: 2.4, duration: 1.1, ease: 'power2.in' },
          );
        },
      },
    ),
  );

  return () => tweens.forEach((t) => t.kill());
};
