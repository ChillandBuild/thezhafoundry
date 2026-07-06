'use server';

import { validateLead } from '../lib/leads';

export type LeadState = {
  status: 'idle' | 'sent' | 'error';
  message: string;
  values?: { link: string; email: string; name: string; message: string };
};

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const raw = {
    link: String(formData.get('link') ?? ''),
    email: String(formData.get('email') ?? ''),
    name: String(formData.get('name') ?? ''),
    message: String(formData.get('message') ?? ''),
  };
  const result = validateLead({ kind: formData.get('kind'), ...raw });

  if (!result.ok) return { status: 'error', message: result.error, values: raw };

  // TODO(launch-gate): deliver the lead — wire Resend (email) or a Slack webhook BEFORE
  // pointing real traffic here. The console.log below is a development stub; hosted
  // runtime logs are short-lived, so it is NOT durable storage for real leads.
  console.log('[zha-lead]', JSON.stringify(result.lead));

  return {
    status: 'sent',
    message:
      result.lead.kind === 'assay'
        ? 'Link received. Your assay report lands in your inbox within 48 hours.'
        : 'Received. A human replies within one working day.',
  };
}
