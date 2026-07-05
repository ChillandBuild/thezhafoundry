import './care.css';

const WATCHES = ['Dependencies patched', 'CVEs closed', 'Uptime watched', 'Token costs tracked', 'Monthly report, signed'];

export function FoundryCare() {
  return (
    <section className="section" id="care" aria-labelledby="care-heading">
      <div className="container">
        <div className="care" data-reveal>
          <div>
            <p className="eyebrow">Foundry Care</p>
            <h3 id="care-heading">The foundry doesn&apos;t leave.</h3>
            <p>
              Software rots from day one — dependencies decay, CVEs appear, costs drift. Care is a
              monthly subscription: our agents watch, patch, and report; a human signs every
              month&apos;s health check.
            </p>
            <ul className="care-list">
              {WATCHES.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
          <a className="btn btn-ghost" href="#contact">Ask about Care</a>
        </div>
      </div>
    </section>
  );
}
