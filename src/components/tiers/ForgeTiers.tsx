import './tiers.css';

const TIERS = [
  {
    name: 'Audit',
    forWho: 'Know where you stand',
    heat: 1,
    featured: false,
    items: [
      'Full assay: security, secrets, tests, scaling, token spend',
      'Prioritized fix plan, ranked by risk',
      'A written report a non-engineer can read',
    ],
  },
  {
    name: 'Harden',
    forWho: 'Make it safe to grow',
    heat: 2,
    featured: true,
    items: [
      'Everything in Audit',
      'Auth and secrets fixed, security holes closed',
      'Test suite built to agreed coverage',
      'Re-assayed and signed before handover',
    ],
  },
  {
    name: 'Full Forge',
    forWho: 'Make it production',
    heat: 3,
    featured: false,
    items: [
      'Everything in Harden',
      'Architecture refactor and containerization',
      'CI/CD with zero-downtime deploys',
      'Token-cost optimization and handover docs',
    ],
  },
] as const;

export function ForgeTiers() {
  return (
    <section className="section" aria-labelledby="tiers-heading">
      <div className="container">
        <p className="eyebrow">The Forge — productized, never hourly</p>
        <h2 id="tiers-heading">Three heats. Fixed scope, fixed quote.</h2>
        <div className="tiers-grid">
          {TIERS.map((tier) => (
            <article key={tier.name} className={tier.featured ? 'tier featured' : 'tier'} data-reveal>
              <p className="tier-heat" aria-hidden="true">
                {[1, 2, 3].map((bar) => (
                  <i key={bar} className={bar <= tier.heat ? 'lit' : undefined} />
                ))}
              </p>
              <h3 className="tier-name">{tier.name}</h3>
              <p className="tier-for">{tier.forWho}</p>
              <ul>
                {tier.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="tier-quote">Fixed quote with your free assay</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
