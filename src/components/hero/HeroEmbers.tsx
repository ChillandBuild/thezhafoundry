'use client';

import { useEffect, useRef } from 'react';

// square sparks — same struck geometry as the mark, now in three depth planes
const COLORS = ['#e07830', '#ffb25e', '#c9611f'];
const MAX_EMBERS = 30;
const BURST_COUNT = 14;
const REPEL_RADIUS = 90;

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  depth: number; // 0 far … 1 near
}

export function HeroEmbers() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let running = true;
    const embers: Ember[] = [];
    const pointer = { x: -9999, y: -9999 };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const makeEmber = (x: number, y: number, burst = false): Ember => {
      const depth = 0.3 + Math.random() * 0.7;
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? 1.4 + Math.random() * 2.2 : 0;
      return {
        x,
        y,
        vx: burst ? Math.cos(angle) * speed : (Math.random() - 0.5) * 0.35 * depth,
        vy: burst ? Math.sin(angle) * speed - 0.8 : -(0.3 + Math.random() * 0.8) * depth,
        life: 0,
        max: burst ? 50 + Math.random() * 50 : 90 + Math.random() * 130,
        size: (1.2 + Math.random() * 1.6) * (0.6 + depth),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        depth,
      };
    };

    const spawn = () => {
      embers.push(
        makeEmber(
          canvas.width * (0.25 + Math.random() * 0.5),
          canvas.height * (0.55 + Math.random() * 0.35),
        ),
      );
    };

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (embers.length < MAX_EMBERS && Math.random() < 0.35) spawn();
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life += 1;
        // sparks drift away from the hand near the forge
        const dx = e.x - pointer.x;
        const dy = e.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_RADIUS * REPEL_RADIUS && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const push = ((REPEL_RADIUS - d) / REPEL_RADIUS) * 0.14 * e.depth;
          e.vx += (dx / d) * push;
          e.vy += (dy / d) * push;
        }
        e.x += e.vx;
        e.y += e.vy;
        e.vx += (Math.random() - 0.5) * 0.04;
        e.vx *= 0.985;
        e.vy *= 0.995;
        const t = e.life / e.max;
        if (t >= 1) {
          embers.splice(i, 1);
          continue;
        }
        const fade = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        ctx.globalAlpha = fade * (0.35 + e.depth * 0.65);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.size, e.size);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const zone = canvas.parentElement ?? canvas;
    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      pointer.x = p.x;
      pointer.y = p.y;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onStrike = (e: PointerEvent) => {
      const p = toLocal(e);
      for (let i = 0; i < BURST_COUNT; i++) {
        if (embers.length < MAX_EMBERS + BURST_COUNT) embers.push(makeEmber(p.x, p.y, true));
      }
    };
    zone.addEventListener('pointermove', onMove);
    zone.addEventListener('pointerleave', onLeave);
    zone.addEventListener('pointerdown', onStrike);

    const io = new IntersectionObserver(([entry]) => {
      const nowRunning = entry.isIntersecting && !document.hidden;
      if (nowRunning && !running) {
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (!nowRunning) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      zone.removeEventListener('pointermove', onMove);
      zone.removeEventListener('pointerleave', onLeave);
      zone.removeEventListener('pointerdown', onStrike);
    };
  }, []);

  return <canvas ref={ref} className="hero-embers" aria-hidden="true" />;
}
