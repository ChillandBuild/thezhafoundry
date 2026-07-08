import { SealHexZ } from '../marks/Marks';
import './standard.css';

const GROUPS: Array<[string, string[]]> = [
  ['Security', ['No secrets in source or client bundles', 'Auth on every route, row-level security on every table', 'User input validated at every boundary']],
  ['Tests', ['Behavioral coverage on every money and data path', 'Tests run in CI on every change', 'Failures block deploys, not weekends']],
  ['Infrastructure', ['Reproducible builds, one-command deploys', 'Rollback plan that has actually been tested', 'Health checks and alerting wired before launch']],
  ['Cost', ['Token budget known per feature, tracked in production', 'Model routing: cheap models for cheap work', 'Caching before scale, not after the bill']],
  ['Provenance', ['Every module attributable: which agent built it, which human approved it', 'Dependency manifest reviewed and pinned', 'Handover docs a stranger could operate from']],
];

export function ZhaStandard() {
  return (
    <section className="section" id="standard" aria-labelledby="standard-heading">
      <div className="container">
        <p className="eyebrow">The Zha Standard</p>
        <h2 id="standard-heading">Our definition of production-ready, in public.</h2>
        <p className="section-sub">
          Every project leaves the foundry checked against this list — and you can check it too.
          That&apos;s the point of publishing it.
        </p>
        <div className="standard-wrap">
          <div className="standard-groups" data-reveal>
            {GROUPS.map(([name, items]) => (
              <div className="standard-group" key={name}>
                <h3>{name}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="standard-version">Zha Standard v0.1 — expands as the foundry learns</p>
          </div>
          <div className="seal-jig">
            <SealHexZ className="standard-seal" />
          </div>
        </div>
      </div>
    </section>
  );
}
