'use client';

import { useActionState } from 'react';
import { submitLead, type LeadState } from '../../app/actions';

const initial: LeadState = { status: 'idle', message: '' };

export function AssayForm() {
  const [state, action, pending] = useActionState(submitLead, initial);

  return (
    <form className="assay" action={action}>
      <input type="hidden" name="kind" value="assay" />
      <label className="assay-label" htmlFor="assay-link">
        Paste your project link. Get a free assay.
      </label>
      <div className="assay-row">
        <input id="assay-link" name="link" className="field" placeholder="github.com/you/your-app" autoComplete="url" />
        <input name="email" type="email" className="field" placeholder="you@company.com" autoComplete="email" aria-label="Email for the report" />
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Reading…' : 'Run the assay'}
        </button>
      </div>
      <p className="assay-note">Free · Security, tests, cost, scale · Read and signed by a human</p>
      {state.status !== 'idle' && (
        <p className="form-status" data-status={state.status} role="status">{state.message}</p>
      )}
      <p className="assay-alt">
        No repo yet? <a href="#contact">Bring an idea instead →</a>
      </p>
    </form>
  );
}
