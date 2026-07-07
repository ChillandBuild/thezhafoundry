'use client';

import { useEffect, useRef } from 'react';

// square sparks — same struck geometry as the mark
const COLORS = ['#e07830', '#ffb25e', '#c9611f'];
const MAX_EMBERS = 18;

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

export function HeroEmbers() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    const embers: Ember[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = () => {
      embers.push({
        x: canvas.width * (0.25 + Math.random() * 0.5),
        y: canvas.height * (0.55 + Math.random() * 0.35),
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(0.35 + Math.random() * 0.75),
        life: 0,
        max: 90 + Math.random() * 120,
        size: 2 + Math.random() * 2,
        color: COLORS[(Math.random() * COLORS.length) | 0],
      });
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (embers.length < MAX_EMBERS && Math.random() < 0.35) spawn();
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life += 1;
        e.x += e.vx;
        e.y += e.vy;
        e.vx += (Math.random() - 0.5) * 0.04;
        const t = e.life / e.max;
        if (t >= 1) {
          embers.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.size, e.size);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="hero-embers" aria-hidden="true" />;
}
