import type { Dimension, Finding, RepoContext, ReviewResult, Submission } from './types';

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const SECTION_TITLES: Record<Dimension, string> = {
  security: 'Security & secrets',
  correctness: 'Correctness & error handling',
  architecture: 'Architecture & scale',
  quality: 'Code quality & maintainability',
};

const STYLE = 'font-family: Georgia, serif; color: #1a1a1a; max-width: 640px; margin: 0 auto; line-height: 1.55;';

function renderFinding(f: Finding): string {
  return `<div style="border-left: 3px solid #8a2b0d; padding: 8px 14px; margin: 12px 0;">
    <p style="margin:0;"><strong>[${escapeHtml(f.severity.toUpperCase())}]</strong> ${escapeHtml(f.title)}${f.file ? ` — <code>${escapeHtml(f.file)}</code>` : ''}</p>
    <p style="margin:6px 0 0;">${escapeHtml(f.evidence)}</p>
    <p style="margin:6px 0 0; color:#444;">Recommended: ${escapeHtml(f.recommendation)}</p>
  </div>`;
}

function renderSection(result: ReviewResult, verified: Finding[]): string {
  const title = `<h2 style="font-size:17px; border-bottom:1px solid #ccc; padding-bottom:4px;">${escapeHtml(SECTION_TITLES[result.dimension])}</h2>`;
  if (!result.ok) {
    return `${title}<p>This dimension of the assay is being read by a human and follows separately.</p>`;
  }
  const mine = verified.filter((f) => f.dimension === result.dimension);
  if (mine.length === 0) return `${title}<p>No confirmed findings in the material provided.</p>`;
  return title + mine.map(renderFinding).join('');
}

export function renderReportEmail(args: {
  submission: Submission;
  results: ReviewResult[];
  verified: Finding[];
  ctx: RepoContext;
}): string {
  const { audit } = args.ctx;
  const auditLine = `${audit.critical} critical, ${audit.high} high, ${audit.moderate} moderate, ${audit.low} low known dependency vulnerabilities.`;
  return `<div style="${STYLE}">
    <p style="letter-spacing:2px; font-size:12px; color:#666;">THE ZHA FOUNDRY — ASSAY REPORT</p>
    <p>Specimen: <code>${escapeHtml(args.submission.link)}</code></p>
    <p>${auditLine} Every finding below was independently re-verified before inclusion; anything that could not be confirmed was left out rather than hedged.</p>
    ${args.results.map((r) => renderSection(r, args.verified)).join('')}
    <p style="margin-top:28px;">Read and signed by a human before sending. Reply to this email to talk through any finding, or to have us forge the fixes.</p>
  </div>`;
}

export function renderSnagEmail(): string {
  return `<div style="${STYLE}">
    <p style="letter-spacing:2px; font-size:12px; color:#666;">THE ZHA FOUNDRY</p>
    <p>Your assay hit a snag on our side — likely the repository is private, moved, or too large for the automated pass.</p>
    <p>A human has been notified and will follow up personally within one working day. Nothing is needed from you.</p>
  </div>`;
}
