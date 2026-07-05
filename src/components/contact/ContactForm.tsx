'use client';

import { useActionState } from 'react';
import { submitLead, type LeadState } from '../../app/actions';

const initial: LeadState = { status: 'idle', message: '' };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitLead, initial);

  return (
    <form className="contact-form" action={action}>
      <input type="hidden" name="kind" value="contact" />
      <div className="row">
        <div>
          <label htmlFor="c-name">Name</label>
          <input
            id="c-name"
            name="name"
            className="field"
            placeholder="Name"
            autoComplete="name"
            defaultValue={state.values?.name}
          />
        </div>
        <div>
          <label htmlFor="c-email">Email</label>
          <input
            id="c-email"
            name="email"
            type="email"
            className="field"
            placeholder="Email"
            autoComplete="email"
            defaultValue={state.values?.email}
          />
        </div>
      </div>
      <div>
        <label htmlFor="c-link">Project link</label>
        <input
          id="c-link"
          name="link"
          className="field"
          placeholder="Project link — GitHub, Replit, Lovable (optional for ideas)"
          defaultValue={state.values?.link}
        />
      </div>
      <div>
        <label htmlFor="c-message">Message</label>
        <textarea
          id="c-message"
          name="message"
          className="field"
          placeholder="What are we casting or forging?"
          defaultValue={state.values?.message}
        />
      </div>
      <div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send it to the foundry'}
        </button>
      </div>
      {state.status !== 'idle' && (
        <p className="form-status" data-status={state.status} role="status">{state.message}</p>
      )}
    </form>
  );
}
