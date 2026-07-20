'use client';

import { useActionState } from 'react';
import { submitLead, type LeadState } from '../../app/actions';

const initial: LeadState = { status: 'idle', message: '' };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitLead, initial);

  return (
    <form className="contact-form" action={action}>
      <input type="hidden" name="kind" value="contact" />
      <div className="hp-slot" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
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
          placeholder="Project link (optional for ideas)"
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
    </form>
  );
}
