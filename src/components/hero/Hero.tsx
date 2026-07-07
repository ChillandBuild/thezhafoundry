import { SteppedZ, SteppedZHeat } from '../marks/Marks';
import { HeroEmbers } from './HeroEmbers';
import './hero.css';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container hero-grid">
        <div>
          <p className="hero-readout">
            Pour temp <span className="temp-value">1,084.6</span> °C — Cu <span>·</span>{' '}
            Independent software foundry
          </p>
          <h1 className="hero-title" id="hero-heading">
            <span className="hero-line">You vibe code it.</span>
            <br />
            <span className="hero-line forge-line">We forge it.</span>
          </h1>
          <p className="hero-sub">
            The independent foundry for AI-built software. We pour new AI-native products,
            take prompt-built prototypes to production, and keep both alive —{' '}
            <strong>audited, hardened, and verified by a human who signs their name.</strong>
          </p>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <HeroEmbers />
          <SteppedZ className="mark-solid" />
          <SteppedZHeat className="mark-heat" />
        </div>
      </div>
    </section>
  );
}
