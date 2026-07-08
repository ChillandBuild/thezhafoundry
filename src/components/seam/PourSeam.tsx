import './seam.css';

export function PourSeam() {
  return (
    <>
      {/* molten wobble for the seam — displacement field the CSS filter points at */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <filter id="seam-molten" x="-60%" y="-5%" width="220%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.012" numOctaves="2" result="n">
            <animate
              attributeName="baseFrequency"
              dur="9s"
              values="0.9 0.012;0.9 0.02;0.9 0.012"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
        </filter>
      </svg>
      <div className="seam" data-seam aria-hidden="true" />
      <div className="seam-tip" data-seam-tip aria-hidden="true" />
      <div className="seam-drip" aria-hidden="true" />
      <div className="seam-drip" aria-hidden="true" />
      <div className="seam-drip" aria-hidden="true" />
    </>
  );
}
