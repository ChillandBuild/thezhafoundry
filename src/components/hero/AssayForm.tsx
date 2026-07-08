'use client';

import { useActionState, useState } from 'react';
import { submitLead, type LeadState } from '../../app/actions';

const initial: LeadState = { status: 'idle', message: '' };

/** Reduce whatever was pasted to a plain host/path for the specimen ticket. */
function specimenLabel(raw: string): string {
  const trimmed = raw.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}

export function AssayForm() {
  const [state, action, pending] = useActionState(submitLead, initial);
  const [specimen, setSpecimen] = useState(state.values?.link ?? '');

  return (
    <form className="assay" action={action}>
      <input type="hidden" name="kind" value="assay" />
      <label className="assay-label" htmlFor="assay-link">
        Paste your project link. Get a free assay.
      </label>
      <div className="assay-row">
        <span className="assay-slot">
          <input
            id="assay-link"
            name="link"
            className="field"
            placeholder="github.com/you/your-app"
            autoComplete="url"
            defaultValue={state.values?.link}
            onChange={(e) => setSpecimen(e.target.value)}
          />
        </span>
        <span className="assay-slot">
          <input
            name="email"
            type="email"
            className="field"
            placeholder="you@company.com"
            autoComplete="email"
            aria-label="Email for the report"
            defaultValue={state.values?.email}
          />
        </span>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Reading…' : 'Run the assay'}
        </button>
      </div>
      <p className="assay-ticket" aria-hidden="true" data-filled={specimen.trim() ? 'true' : undefined}>
        {specimen.trim() ? `▸ specimen received · ${specimenLabel(specimen)}` : '▸ intake slot open'}
      </p>
      <p className="assay-note">Free · Security, tests, cost, scale · Read and signed by a human</p>
      {/* Always in the tree with aria-live so announcements are reliable; the
          role="status" mapping appears only once populated, so a page with two
          forms exposes a single populated status region at a time. */}
      <p
        className="form-status"
        data-status={state.status}
        aria-live="polite"
        aria-atomic="true"
        role={state.status === 'idle' ? undefined : 'status'}
      >
        {state.status === 'idle' ? '' : state.message}
      </p>
      <p className="assay-alt">
        No repo yet? <a href="#contact">Bring an idea instead →</a>
      </p>
    </form>
  );
}
