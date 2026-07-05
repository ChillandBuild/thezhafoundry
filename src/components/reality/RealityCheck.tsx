import './reality.css';

const ROWS: Array<[string, string]> = [
  ['"Works on my machine" local environment', 'Cloud-native, auto-scaling architecture'],
  ['Brittle code and silent runtime failures', 'Engineered test coverage, verified before handover'],
  ['Exposed API keys and prompt-injection risk', 'Hardened security, encryption, and proper auth'],
  ['Token-bloated, expensive LLM calls', 'Optimized model routing and semantic caching'],
];

export function RealityCheck() {
  return (
    <section className="section" aria-labelledby="reality-heading">
      <div className="container">
        <p className="eyebrow">The reality check</p>
        <h2 id="reality-heading">What comes in. What goes out.</h2>
        <div className="reality-scroll" data-reveal>
          <table className="reality-table">
            <caption>Comparison of vibe-coded input versus Zha Foundry output</caption>
            <thead>
              <tr>
                <th className="in" scope="col">Raw material — the vibe-coded input</th>
                <th className="out" scope="col">Cast metal — the foundry output</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([input, output]) => (
                <tr key={output}>
                  <td className="in">{input}</td>
                  <td className="out">{output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
