import type { Gsap } from './types';

const NOISE = '▓▒░<>/¦01';

/**
 * Instrument decode: text resolves out of foundry-readout glyph noise,
 * left to right, like a gauge coming online. Text-only elements.
 */
export function decode(gsap: Gsap, el: Element, duration = 0.7): void {
  const finalText = el.textContent ?? '';
  if (!finalText.trim()) return;
  const proxy = { p: 0 };
  gsap.to(proxy, {
    p: 1,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      const settled = Math.floor(proxy.p * finalText.length);
      let out = finalText.slice(0, settled);
      for (let i = settled; i < finalText.length; i++) {
        const ch = finalText[i];
        out += ch === ' ' ? ' ' : NOISE[(Math.random() * NOISE.length) | 0];
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = finalText;
    },
  });
}
