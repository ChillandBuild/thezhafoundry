type MarkProps = { className?: string; stroke?: string };

const Z_POINTS = '14,14 50,14 50,23 38,23 38,32 26,32 26,41 14,41 14,50 50,50';

export function SteppedZ({ className, stroke = 'var(--copper)' }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <polyline points={Z_POINTS} stroke={stroke} strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    </svg>
  );
}

export function SteppedZHeat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="zha-heat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc46b" />
          <stop offset="0.38" stopColor="#ff9a3d" />
          <stop offset="0.68" stopColor="#e07830" />
          <stop offset="1" stopColor="#8a8078" />
        </linearGradient>
      </defs>
      <polyline points={Z_POINTS} stroke="url(#zha-heat)" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    </svg>
  );
}

export function SealHexZ({ className, stroke = 'var(--copper)' }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M32 3 L57 17 V47 L32 61 L7 47 V17 Z" stroke={stroke} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
      <polyline
        points="21.2,21.2 42.8,21.2 42.8,26.6 35.6,26.6 35.6,32 28.4,32 28.4,37.4 21.2,37.4 21.2,42.8 42.8,42.8"
        stroke={stroke} strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" fill="none"
      />
    </svg>
  );
}

export function LadderRail({ className, stroke = 'var(--line)' }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M24 9 V57 M40 9 V57" stroke={stroke} strokeWidth="4" strokeLinecap="square" />
      <path d="M17 12 H47 M17 19 H47 M17 26 H47 M17 33 H47 M17 40 H47 M17 47 H47 M17 54 H47" stroke={stroke} strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}
