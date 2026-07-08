import './process.css';

const STAGES = [
  ['Stage 01 — Intake & Audit', 'The material arrives', 'A repo link or an idea brief. We assay what exists and scope what should.'],
  ['Stage 02 — Blueprint', 'Architect and PM agents draw the plan', 'Requirements broken down, production schema designed, scope fixed in writing.'],
  ['Stage 03 — Assembly', 'The agent loops run', 'Engineer and QA agents write, test, refactor, and re-test until every assertion holds.'],
  ['Stage 04 — Human Review', 'A person signs their name', 'Every line the agents produced gets read, challenged, and approved by a human engineer.'],
  ['Stage 05 — Shipment', 'Cast metal leaves the floor', 'A running production environment, handover docs, and the option to keep us watching.'],
] as const;

export function ProcessLine() {
  return (
    <section className="section" id="process" aria-labelledby="process-heading">
      <div className="container">
        <p className="eyebrow">The production line</p>
        <h2 id="process-heading">Five stages. Both doors. Same exit.</h2>
        <div className="process-wrap">
          <span className="process-fill" data-process-fill aria-hidden="true" />
          <ol className="process-list">
          {STAGES.map(([tag, title, body], i) => (
            <li key={tag} className="stage" data-ignite data-num={`0${i + 1}`}>
              <p className="stage-tag">{tag}</p>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
