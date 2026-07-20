'use server';

import { baseUrl, loadEnv } from '../lib/assay/config';
import { defaultDeps } from '../lib/assay/deps';
import { processLead, type IntakeDeps } from '../lib/assay/intake';

export type LeadState = {
  status: 'idle' | 'sent' | 'error';
  message: string;
  values?: { link: string; email: string; name: string; message: string };
};

function intakeDeps(): IntakeDeps {
  const env = loadEnv();
  const deps = defaultDeps();
  return {
    store: deps.store,
    notifyFounder: deps.notifyFounder,
    log: deps.log,
    kickoff: async (submissionId) => {
      const res = await fetch(`${baseUrl()}/api/assay/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-assay-secret': env.ASSAY_RUN_SECRET },
        body: JSON.stringify({ submissionId }),
      });
      if (res.status !== 202) throw new Error(`kickoff rejected: ${res.status}`);
    },
  };
}

export async function submitLead(prev: LeadState, formData: FormData): Promise<LeadState> {
  return processLead(intakeDeps(), prev, formData);
}
