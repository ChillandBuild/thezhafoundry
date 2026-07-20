import { describe, expect, test } from 'vitest';
import { runAssayPipeline } from '../../src/lib/assay/pipeline';
import type { AssayDeps, RepoContext, Submission, SubmissionStatus } from '../../src/lib/assay/types';

const ctx: RepoContext = {
  repoUrl: 'https://github.com/a/b.git',
  fileList: ['x.ts'],
  files: [{ path: 'x.ts', content: 'c' }],
  audit: { critical: 0, high: 0, moderate: 0, low: 0 },
  secretHits: [],
};
const sub: Submission = {
  id: 'id1', kind: 'assay', email: 'a@b.co', link: 'github.com/a/b',
  name: '', message: '', status: 'pending', createdAt: 'now',
};

function makeFakes(overrides: Partial<AssayDeps> = {}) {
  const calls = {
    emails: [] as { to: string; subject: string }[],
    founder: [] as string[],
    statuses: [] as SubmissionStatus[],
  };
  const deps: AssayDeps = {
    store: {
      insert: async () => 'id1',
      get: async () => sub,
      setStatus: async (_id, status) => { calls.statuses.push(status); },
      saveReport: async () => {},
      countToday: async () => 0,
      countTodayByEmail: async () => 0,
    },
    sendEmail: async (m) => { calls.emails.push({ to: m.to, subject: m.subject }); },
    notifyFounder: async (s) => { calls.founder.push(s); },
    generate: (async ({ prompt }: { prompt: string }) =>
      prompt.includes('SKEPTICAL')
        ? { confirmed: true, reason: 'ok' }
        : { findings: [{ title: 'F', severity: 'high', evidence: 'e', recommendation: 'r' }] }) as AssayDeps['generate'],
    collectRepo: async () => ctx,
    log: () => {},
    ...overrides,
  };
  return { deps, calls };
}

describe('runAssayPipeline', () => {
  test('happy path: running -> report emailed -> sent -> founder notified', async () => {
    const { deps, calls } = makeFakes();
    await runAssayPipeline(deps, 'id1');
    expect(calls.statuses).toEqual(['running', 'sent']);
    expect(calls.emails[0].to).toBe('a@b.co');
    expect(calls.founder.some((s) => s.includes('Assay sent'))).toBe(true);
  });
  test('sandbox failure: failed status, snag email, founder alert, no report', async () => {
    const { deps, calls } = makeFakes({ collectRepo: async () => { throw new Error('clone failed'); } });
    await runAssayPipeline(deps, 'id1');
    expect(calls.statuses).toEqual(['running', 'failed']);
    expect(calls.emails[0].subject).toMatch(/snag/i);
    expect(calls.founder.some((s) => s.includes('failed'))).toBe(true);
  });
  test('unknown or non-assay submission is a no-op', async () => {
    const { deps, calls } = makeFakes({ store: { ...makeFakes().deps.store, get: async () => null } });
    await runAssayPipeline(deps, 'missing');
    expect(calls.statuses).toEqual([]);
  });
  test('late-stage crash (email send) still marks failed and alerts founder', async () => {
    const { deps, calls } = makeFakes({ sendEmail: async () => { throw new Error('resend down'); } });
    await runAssayPipeline(deps, 'id1');
    expect(calls.statuses).toEqual(['running', 'failed']);
    expect(calls.founder.some((s) => s.includes('failed'))).toBe(true);
  });
});
