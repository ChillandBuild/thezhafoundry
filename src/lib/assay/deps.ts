import { Resend } from 'resend';
import { loadEnv } from './config';
import { makeGenerate } from './model';
import { escapeHtml } from './report';
import { collectRepo } from './sandbox';
import { makeStore } from './store';
import type { AssayDeps } from './types';

export function defaultDeps(): AssayDeps {
  const env = loadEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const sendEmail: AssayDeps['sendEmail'] = async ({ to, subject, html }) => {
    const { error } = await resend.emails.send({ from: env.RESEND_FROM, to, subject, html });
    if (error) throw new Error(`resend: ${error.message}`);
  };
  return {
    store: makeStore(env.DATABASE_URL),
    sendEmail,
    notifyFounder: (subject, body) =>
      sendEmail({ to: env.FOUNDER_EMAIL, subject: `[zha] ${subject}`, html: `<pre>${escapeHtml(body)}</pre>` }),
    generate: makeGenerate(env.ASSAY_MODEL),
    collectRepo,
    // console.error is deliberate: structured stderr is the v1 logger.
    log: (message, data) => console.error('[assay]', message, data ?? ''),
  };
}
