import { expect, test } from 'vitest';
import { runReviewers, DIMENSIONS, buildReviewPrompt } from '../../src/lib/assay/review';
import type { GenerateFn, RepoContext } from '../../src/lib/assay/types';

const ctx: RepoContext = {
  repoUrl: 'https://github.com/a/b',
  fileList: ['index.ts'],
  files: [{ path: 'index.ts', content: 'export const x = 1;' }],
  audit: { critical: 1, high: 0, moderate: 0, low: 0 },
  secretHits: [],
};

test('runs all four dimensions in parallel and tags findings', async () => {
  const generate: GenerateFn = async () =>
    ({ findings: [{ title: 'T', severity: 'high', evidence: 'E', recommendation: 'R' }] }) as never;
  const results = await runReviewers({ generate, log: () => {} }, ctx);
  expect(results.map((r) => r.dimension)).toEqual([...DIMENSIONS]);
  expect(results.every((r) => r.ok && r.findings[0].dimension === r.dimension)).toBe(true);
});

test('one failing dimension is isolated, others survive', async () => {
  const generate: GenerateFn = async ({ prompt }) => {
    if (prompt.includes('SECURITY REVIEW')) throw new Error('model down');
    return { findings: [] } as never;
  };
  const logged: string[] = [];
  const results = await runReviewers({ generate, log: (m) => logged.push(m) }, ctx);
  expect(results.find((r) => r.dimension === 'security')?.ok).toBe(false);
  expect(results.filter((r) => r.ok)).toHaveLength(3);
  expect(logged.some((m) => m.includes('reviewer failed'))).toBe(true);
});

test('prompt carries repo evidence: files, audit counts, rubric', () => {
  const prompt = buildReviewPrompt('security', ctx);
  expect(prompt).toContain('SECURITY REVIEW');
  expect(prompt).toContain('index.ts');
  expect(prompt).toContain('"critical": 1');
});
