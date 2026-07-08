import { CareTicker } from './CareTicker';
import './care.css';

const WATCHES = ['Dependencies patched', 'CVEs closed', 'Uptime watched', 'Token costs tracked', 'Monthly report, signed'];

// one slow heartbeat across the console — the trace of a watch that never leaves
const TRACE = 'M0 20 H120 l6 -9 6 14 6 -5 H320 l6 -9 6 14 6 -5 H520 l6 -9 6 14 6 -5 H720';

export function FoundryCare() {
  return (
    <section className="section" id="care" aria-labelledby="care-heading">
      <div className="container">
        <div className="care" data-reveal>
          <svg className="care-trace" viewBox="0 0 720 40" preserveAspectRatio="none" aria-hidden="true">
            <path d={TRACE} fill="none" stroke="var(--copper)" strokeWidth="1.5" />
          </svg>
          <div className="care-body">
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
            <CareTicker />
          </div>
          <a className="btn btn-ghost" href="#contact">Ask about Care</a>
        </div>
      </div>
    </section>
  );
}
