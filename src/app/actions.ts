'use server';

import { validateLead } from '../lib/leads';

export type LeadState = { status: 'idle' | 'sent' | 'error'; message: string };

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const result = validateLead({
    kind: formData.get('kind'),
    link: formData.get('link') ?? undefined,
    email: formData.get('email') ?? undefined,
    name: formData.get('name') ?? undefined,
    message: formData.get('message') ?? undefined,
  });

  if (!result.ok) return { status: 'error', message: result.error };

  // TODO(launch): deliver the lead — wire Resend (email) or a Slack webhook here.
  // Until then it lands in the server log so no submission is silently lost.
  console.log('[zha-lead]', JSON.stringify(result.lead));

  return {
    status: 'sent',
    message:
      result.lead.kind === 'assay'
        ? 'Link received. Your assay report lands in your inbox within 48 hours.'
        : 'Received. A human replies within one working day.',
  };
}
