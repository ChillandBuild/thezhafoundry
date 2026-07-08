import type { Effect } from './types';

const POUR_TEMP = 1084.6; // °C — copper leaves the crucible
const AMBIENT = 24.0; // °C — the casting on the floor

/**
 * The page is a pour: the nav gauge cools from copper's melting point at the
 * top of the page to ambient at the footer. Metal cools fast, then slow.
 */
export const temperature: Effect = ({ gsap, ScrollTrigger }) => {
  const value = document.querySelector<HTMLElement>('[data-nav-temp]');
  const gauge = document.querySelector<HTMLElement>('.nav-temp');
  if (!value || !gauge) return;

  const hot = getComputedStyle(document.documentElement).getPropertyValue('--hot').trim();
  const steel = getComputedStyle(document.documentElement).getPropertyValue('--steel').trim();

  ScrollTrigger.create({
    start: 0,
    end: () => document.documentElement.scrollHeight - window.innerHeight,
    scrub: 0.4,
    onUpdate: (self) => {
      const cooled = Math.pow(self.progress, 0.55); // fast drop off the pour, long tail
      const t = POUR_TEMP - cooled * (POUR_TEMP - AMBIENT);
      value.textContent = t.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      gauge.style.color = gsap.utils.interpolate(hot, steel, cooled);
    },
  });

  return () => {
    gauge.style.color = '';
  };
};
