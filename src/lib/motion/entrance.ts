import { decode } from './decode';
import type { Effect } from './types';

/** Split a hero line into word groups of per-character spans — words never break. */
function splitChars(line: HTMLElement): HTMLElement[] {
  const text = line.textContent ?? '';
  const finalColor = getComputedStyle(line).color;
  line.setAttribute('aria-hidden', 'true');
  line.textContent = '';
  const chars: HTMLElement[] = [];
  text.split(' ').forEach((word, i) => {
    if (i > 0) line.appendChild(document.createTextNode(' '));
    const group = document.createElement('span');
    group.className = 'hero-word';
    for (const ch of word) {
      const span = document.createElement('span');
      span.className = 'hero-char';
      span.textContent = ch;
      span.dataset.cool = finalColor;
      group.appendChild(span);
      chars.push(span);
    }
    line.appendChild(group);
  });
  return chars;
}

/**
 * Hero entrance — one orchestrated pour on load: readouts decode,
 * each headline glyph is poured molten and cools to its final color,
 * the mark scales in, the pour-temp gauge counts to copper's melting point.
 */
export const entrance: Effect = ({ gsap }) => {
  const title = document.querySelector<HTMLElement>('.hero-title');
  if (title) {
    // keep the heading readable to AT while glyphs are split for animation
    title.setAttribute('aria-label', title.textContent ?? '');
  }
  const lines = gsap.utils.toArray<HTMLElement>('.hero-line');
  const chars = lines.flatMap(splitChars);

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero-readout', { y: 14, opacity: 0, duration: 0.5 });

  tl.fromTo(
    chars,
    { y: 44, opacity: 0, color: '#ffb25e' },
    {
      y: 0,
      opacity: 1,
      duration: 0.7,
      stagger: 0.022,
      color: (i, el) => (el as HTMLElement).dataset.cool ?? '',
      onComplete: () => {
        // hand color control back to the cascade so theme toggles keep working
        chars.forEach((c) => {
          c.style.color = '';
        });
      },
    },
    '-=0.2',
  );

  tl.from('.hero-sub', { y: 18, opacity: 0, duration: 0.6 }, '-=0.45');
  tl.from('.hero-cta', { y: 16, opacity: 0, duration: 0.5 }, '-=0.35');
  tl.from('.hero-mark', { scale: 0.92, opacity: 0, duration: 0.9, ease: 'power2.out' }, '-=0.6');

  document.querySelectorAll('.hero-readout [data-decode]').forEach((el) => decode(gsap, el, 0.9));

  const temp = document.querySelector('.temp-value');
  if (temp) {
    const counter = { v: 24 };
    tl.to(
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
};
