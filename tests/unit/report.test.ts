import { describe, expect, test } from 'vitest';
import { escapeHtml, renderReportEmail, renderSnagEmail } from '../../src/lib/assay/report';
import type { Finding, ReviewResult, RepoContext, Submission } from '../../src/lib/assay/types';

const sub: Submission = {
  id: '1', kind: 'assay', email: 'a@b.co', link: 'github.com/a/b',
  name: '', message: '', status: 'running', createdAt: 'now',
};
const ctx: RepoContext = {
  repoUrl: 'https://github.com/a/b', fileList: ['x.ts'], files: [],
  audit: { critical: 2, high: 0, moderate: 0, low: 0 }, secretHits: [],
};
const ok = (d: ReviewResult['dimension'], findings: Finding[] = []): ReviewResult =>
  ({ dimension: d, ok: true, findings });

test('escapeHtml neutralizes markup', () => {
  expect(escapeHtml(`<img src=x onerror="a&b">'`)).toBe('&lt;img src=x onerror=&quot;a&amp;b&quot;&gt;&#39;');
});

describe('renderReportEmail', () => {
  const finding: Finding = {
    dimension: 'security', title: '<script>bad</script>', severity: 'critical',
    file: 'lib/db.ts', evidence: 'service role key in client bundle', recommendation: 'move to server env',
  };
  test('renders four sections, escapes model output, includes audit counts', () => {
    const html = renderReportEmail({
      submission: sub, verified: [finding], ctx,
      results: [ok('security', [finding]), ok('correctness'), ok('architecture'), ok('quality')],
    });
    expect(html).toContain('Security &amp; secrets');
    expect(html).toContain('Correctness');
    expect(html).toContain('&lt;script&gt;bad&lt;/script&gt;');
    expect(html).not.toContain('<script>bad');
    expect(html).toContain('2 critical');
  });
  test('failed dimension gets manual follow-up note; clean dimension states no findings', () => {
    const html = renderReportEmail({
      submission: sub, verified: [], ctx,
      results: [
        { dimension: 'security', ok: false, findings: [] },
        ok('correctness'), ok('architecture'), ok('quality'),
      ],
    });
    expect(html).toMatch(/security.*read by a human and follows separately/is);
    expect(html).toMatch(/no confirmed findings/i);
  });
});

test('snag email is quiet and promises human follow-up', () => {
  const html = renderSnagEmail();
  expect(html).toMatch(/human/i);
  expect(html).not.toContain('!');
});
