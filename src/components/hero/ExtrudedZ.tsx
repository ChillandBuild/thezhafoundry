'use client';

import { useEffect, useRef } from 'react';
import { SteppedZ, SteppedZHeat } from '../marks/Marks';

// depth stack: carbon shadow layers rise to the molten face
const LAYERS = [
  { z: -36, stroke: '#241d18' },
  { z: -27, stroke: '#38271c' },
  { z: -18, stroke: '#5a3013' },
  { z: -9, stroke: 'var(--deep)' },
] as const;

const TILT_MAX = 9; // degrees

/**
 * The Stepped Z as a casting, not a glyph: stacked strokes extrude it into
 * depth, and the whole billet tilts a few degrees toward the pointer.
 */
export function ExtrudedZ() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let rx = 0;
    let ry = 0;

    const step = () => {
      rx += (targetX - rx) * 0.08;
      ry += (targetY - ry) * 0.08;
      el.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
      if (Math.abs(targetX - rx) > 0.01 || Math.abs(targetY - ry) > 0.01) {
        raf = requestAnimationFrame(step);
      } else {
        raf = 0;
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      targetY = Math.max(-1, Math.min(1, nx)) * TILT_MAX;
      targetX = Math.max(-1, Math.min(1, -ny)) * TILT_MAX;
      kick();
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      kick();
    };

    const zone = el.closest('.hero') ?? el;
    zone.addEventListener('pointermove', onMove as EventListener);
    zone.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      zone.removeEventListener('pointermove', onMove as EventListener);
      zone.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="extruded-z" ref={ref} aria-hidden="true">
      {LAYERS.map(({ z, stroke }) => (
        <div key={z} className="z-layer" style={{ transform: `translateZ(${z}px)` }}>
          <SteppedZ stroke={stroke} />
        </div>
      ))}
      <div className="z-layer z-face" style={{ transform: 'translateZ(0px)' }}>
        <SteppedZ className="mark-solid" />
        <SteppedZHeat className="mark-heat" />
      </div>
    </div>
  );
}
