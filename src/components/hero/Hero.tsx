import { SteppedZ, SteppedZHeat } from '../marks/Marks';
import { AssayForm } from './AssayForm';
import './hero.css';

export function Hero() {
  return (
    <section className="hero" id="assay" aria-labelledby="hero-heading">
      <div className="container hero-grid">
        <div>
          <p className="hero-readout">
            Pour temp 1,084.6 °C — Cu <span>·</span> Independent software foundry
          </p>
          <h1 className="hero-title" id="hero-heading">
            You vibe code it.<br />
            <span className="forge-line">We forge it.</span>
          </h1>
          <p className="hero-sub">
            The independent foundry for AI-built software. We pour new AI-native products,
            take prompt-built prototypes to production, and keep both alive —{' '}
            <strong>audited, hardened, and verified by a human who signs their name.</strong>
          </p>
          <AssayForm />
        </div>
        <div className="hero-mark" aria-hidden="true">
          <SteppedZ className="mark-solid" />
          <SteppedZHeat className="mark-heat" />
        </div>
      </div>
    </section>
  );
}
