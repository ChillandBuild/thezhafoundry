import { HeroEmbers } from './HeroEmbers';
import { ExtrudedZ } from './ExtrudedZ';
import { MoltenField } from './MoltenField';
import './hero.css';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <MoltenField />
      <div className="container hero-grid">
        <div>
          <p className="hero-readout">
            <span data-decode>Pour temp</span> <span className="temp-value">1,084.6</span> °C — Cu{' '}
            <span className="dim">·</span> <span data-decode>Independent software foundry</span>
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
          <p className="hero-cta">
            <a className="btn" href="#assay">Run the assay</a>
            <a className="btn btn-ghost" href="#contact">Bring a project</a>
          </p>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <HeroEmbers />
          <ExtrudedZ />
        </div>
      </div>
    </section>
  );
}
