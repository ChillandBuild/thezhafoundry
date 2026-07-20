import type { LeadState } from '../../app/actions';
import { validateLead } from '../leads';
import { admissionDecision, isSpam, parseGitHubRepo } from './domain';
import type { SubmissionStore } from './types';

export interface IntakeDeps {
  store: SubmissionStore;
  notifyFounder(subject: string, body: string): Promise<void>;
  kickoff(submissionId: string): Promise<void>;
  log(message: string, data?: unknown): void;
}

const ASSAY_SENT: LeadState = {
  status: 'sent',
  message: 'Link received. Your assay report lands in your inbox within 48 hours.',
};
const CONTACT_SENT: LeadState = {
  status: 'sent',
  message: 'Received. A human replies within one working day.',
};

export async function processLead(deps: IntakeDeps, _prev: LeadState, formData: FormData): Promise<LeadState> {
  if (isSpam(formData)) return ASSAY_SENT; // pretend success; store nothing

  const raw = {
    link: String(formData.get('link') ?? ''),
    email: String(formData.get('email') ?? ''),
    name: String(formData.get('name') ?? ''),
    message: String(formData.get('message') ?? ''),
  };
  const result = validateLead({ kind: formData.get('kind'), ...raw });
  if (!result.ok) return { status: 'error', message: result.error, values: raw };
  const lead = result.lead;

  if (lead.kind === 'contact') {
    await deps.store.insert({
      kind: 'contact', email: lead.email, link: lead.link,
      name: lead.name, message: lead.message, status: 'manual',
    });
    await deps.notifyFounder('New contact lead', `${lead.name} <${lead.email}> · ${lead.link}\n\n${lead.message}`);
    return CONTACT_SENT;
  }

  const base = { kind: 'assay' as const, email: lead.email, link: lead.link, name: '', message: '' };
  if (!parseGitHubRepo(lead.link)) {
    await deps.store.insert({ ...base, status: 'manual' });
    await deps.notifyFounder('Manual assay needed (non-GitHub link)', `${lead.email} · ${lead.link}`);
    return ASSAY_SENT;
  }

  const [globalToday, emailToday] = await Promise.all([
    deps.store.countToday(),
    deps.store.countTodayByEmail(lead.email),
  ]);
  if (admissionDecision({ globalToday, emailToday }) === 'queue') {
    const id = await deps.store.insert({ ...base, status: 'queued' });
    await deps.notifyFounder('Assay queued (daily cap)', `${lead.email} · ${lead.link} · id ${id}`);
    return ASSAY_SENT;
  }

  const id = await deps.store.insert({ ...base, status: 'pending' });
  try {
    await deps.kickoff(id);
  } catch (error: unknown) {
    deps.log('kickoff failed', error);
    await deps.notifyFounder('Assay kickoff failed — run manually', `id ${id} · ${lead.email} · ${lead.link}`);
  }
  return ASSAY_SENT;
}
