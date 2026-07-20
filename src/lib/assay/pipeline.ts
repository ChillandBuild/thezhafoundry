import { parseGitHubRepo } from './domain';
import { renderReportEmail, renderSnagEmail } from './report';
import { runReviewers } from './review';
import { verifyFindings } from './verify';
import type { AssayDeps, RepoContext } from './types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}

/**
 * Rebuilt from the validated owner/repo parse rather than the raw submitted
 * string: owner and repo are restricted to [\w.-]+, so the result can never
 * start with '-' (git argument injection) or smuggle an ext:: transport.
 */
function canonicalCloneUrl(link: string): string {
  const parsed = parseGitHubRepo(link);
  if (!parsed) throw new Error(`not a GitHub repo link: ${link}`);
  return `https://github.com/${parsed.owner}/${parsed.repo}.git`;
}

export async function runAssayPipeline(deps: AssayDeps, submissionId: string): Promise<void> {
  const submission = await deps.store.get(submissionId);
  if (!submission || submission.kind !== 'assay') return;
  await deps.store.setStatus(submissionId, 'running');

  let ctx: RepoContext;
  try {
    ctx = await deps.collectRepo(canonicalCloneUrl(submission.link));
  } catch (error: unknown) {
    const detail = errorMessage(error);
    await deps.store.setStatus(submissionId, 'failed', detail);
    await deps.sendEmail({
      to: submission.email,
      subject: 'Your assay hit a snag — a human follows up',
      html: renderSnagEmail(),
    });
    await deps.notifyFounder('Assay failed (sandbox)', `${submission.email} · ${submission.link} · ${detail}`);
    return;
  }

  try {
    const results = await runReviewers(deps, ctx);
    const verified = await verifyFindings(deps, results.flatMap((r) => r.findings), ctx);
    const html = renderReportEmail({ submission, results, verified, ctx });
    await deps.store.saveReport(submissionId, html, verified);
    await deps.sendEmail({ to: submission.email, subject: 'Your assay report — The Zha Foundry', html });
    await deps.store.setStatus(submissionId, 'sent');
    await deps.notifyFounder(
      'Assay sent',
      `${submission.email} · ${submission.link} · ${verified.length} confirmed findings · dimensions ok: ${results.filter((r) => r.ok).length}/4`,
    );
  } catch (error: unknown) {
    const detail = errorMessage(error);
    await deps.store.setStatus(submissionId, 'failed', detail);
    await deps.notifyFounder('Assay failed (pipeline)', `${submission.email} · ${submission.link} · ${detail}`);
  }
}
