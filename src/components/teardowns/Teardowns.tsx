import './teardowns.css';

export function Teardowns() {
  return (
    <section className="section" id="teardowns" aria-labelledby="teardowns-heading">
      <div className="container">
        <p className="eyebrow">Teardowns</p>
        <h2 id="teardowns-heading">Every rescue gets published.</h2>
        <p className="section-sub">
          Before, after, and what it took — real repos, real failures, real fixes. The first
          castings are on the floor now.
        </p>
        <div className="teardown-grid">
          {['Nº 001', 'Nº 002', 'Nº 003'].map((n) => (
            <article className="teardown" key={n} data-reveal>
              <p className="teardown-no">Teardown {n}</p>
              <p className="teardown-state">In the crucible</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
