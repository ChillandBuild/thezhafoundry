import type { Effect } from './types';

/** Magnetic pull on solid CTAs — molten metal answers the hand that reaches for it. */
export const magnetic: Effect = ({ gsap }) => {
  const removers: Array<() => void> = [];

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

  return () => removers.forEach((remove) => remove());
};
