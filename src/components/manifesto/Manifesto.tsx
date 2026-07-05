import './manifesto.css';

const REFUSALS: Array<[string, string]> = [
  ["We don't bill hours", "Every engagement is a fixed scope with a fixed quote, agreed before work starts. The meter never runs."],
  ["We don't ship unreviewed agent output", "Agents build fast; humans decide what leaves. Every stage of the line ends at a human gate."],
  ["We don't grade our own homework", "The Zha Standard is public. Check anything we ship against it — that's what it's for."],
  ["We don't do open-ended engagements", "No retainers that drift, no phase twos that never end. A scope closes, the metal ships."],
];

export function Manifesto() {
  return (
    <section className="section" aria-labelledby="manifesto-heading">
      <div className="container">
        <p className="eyebrow">Positions</p>
        <h2 id="manifesto-heading">What we don&apos;t do</h2>
        <div className="manifesto-grid">
          {REFUSALS.map(([title, body]) => (
            <article key={title} className="refusal" data-reveal>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
