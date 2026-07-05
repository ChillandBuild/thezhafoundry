import './doors.css';

const CAST_LINE = ['PRD', 'SCHEMA', 'CODE', 'TESTS', 'DEPLOY'];

export function TwoDoors() {
  return (
    <section className="section" aria-labelledby="doors-heading">
      <div className="container">
        <p className="eyebrow">Two doors, one production line</p>
        <h2 id="doors-heading">Bring an idea, or bring a prototype. Both leave forged.</h2>
        <div className="doors-grid">
          <article className="door" id="cast" data-reveal>
            <p className="door-tag">Door 01 — The Cast</p>
            <h3>Bring an idea. We pour the product.</h3>
            <p>
              An agent assembly line builds it: a PM agent drafts the requirements, an architect
              agent designs the data model, engineer agents write the code, QA agents try to break
              it. <strong>Every stage ends at a human gate — nothing ships unreviewed.</strong>{' '}
              Fixed-scope MVP sprints. Born forged: verified against the Zha Standard from day one.
            </p>
            <p className="door-line" aria-label="Cast pipeline stages">
              {CAST_LINE.map((stage, i) => (
                <span key={stage}>
                  {stage} <span className="gate" title="Human sign-off">⌖</span>
                  {i < CAST_LINE.length - 1 && <span className="arrow"> → </span>}
                </span>
              ))}
            </p>
          </article>
          <article className="door" id="forge" data-reveal>
            <p className="door-tag">Door 02 — The Forge</p>
            <h3>Bring a prototype. We make it production.</h3>
            <p>
              Your app works in the demo and breaks everywhere else. We refactor the architecture,
              harden auth and secrets, build the test suite, containerize it, wire zero-downtime
              deploys, and cut the token bill. <strong>Specialty: Next.js + Supabase apps from
              Lovable, Bolt, v0, and Cursor</strong> — the stack most AI tools generate.
            </p>
            <p className="door-line" aria-label="Forge pipeline stages">
              INTAKE <span className="arrow">→</span> AUDIT <span className="arrow">→</span> HARDEN{' '}
              <span className="arrow">→</span> VERIFY <span className="gate" title="Human sign-off">⌖</span>{' '}
              <span className="arrow">→</span> SHIP
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
