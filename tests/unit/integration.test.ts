import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from 'vitest';
import { scanSecrets, selectFiles } from '../../src/lib/assay/analysis';
import { runAssayPipeline } from '../../src/lib/assay/pipeline';
import type { AssayDeps, RepoContext, RepoFile } from '../../src/lib/assay/types';

const ROOT = join(__dirname, '..', 'fixtures', 'leaky-app');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [relative(ROOT, full)];
  });
}

function fixtureRepo(): RepoContext {
  const fileList = walk(ROOT);
  const files: RepoFile[] = selectFiles(fileList).map((path) => ({
    path,
    content: readFileSync(join(ROOT, path), 'utf8'),
  }));
  return {
    repoUrl: 'https://github.com/fixture/leaky-app.git',
    fileList,
    files,
    audit: { critical: 0, high: 1, moderate: 0, low: 0 },
    secretHits: scanSecrets(files),
  };
}

test('end-to-end over fixture: planted flaws reach the delivered report', async () => {
  const sent: { to: string; html: string }[] = [];
  const ctx = fixtureRepo();
  expect(ctx.secretHits).toContainEqual(
    expect.objectContaining({ path: 'lib/db.ts', kind: 'supabase-service-role-jwt' }),
  );

  const deps: AssayDeps = {
    store: {
      insert: async () => 'i1',
      get: async () => ({
        id: 'i1', kind: 'assay', email: 'c@d.co', link: 'github.com/fixture/leaky-app',
        name: '', message: '', status: 'pending', createdAt: 'now',
      }),
      setStatus: async () => {},
      saveReport: async () => {},
      countToday: async () => 0,
      countTodayByEmail: async () => 0,
    },
    sendEmail: async (m) => { sent.push({ to: m.to, html: m.html }); },
    notifyFounder: async () => {},
    generate: (async ({ prompt }: { prompt: string }) => {
      if (prompt.includes('SKEPTICAL')) return { confirmed: true, reason: 'evidence present' };
      if (prompt.includes('SECURITY REVIEW')) {
        return {
          findings: [{
            title: 'Service-role key shipped to client', severity: 'critical', file: 'lib/db.ts',
            evidence: 'JWT with service_role in lib/db.ts', recommendation: 'Move to server-only env var',
          }],
        };
      }
      return { findings: [] };
    }) as AssayDeps['generate'],
    collectRepo: async () => ctx,
    log: () => {},
  };

  await runAssayPipeline(deps, 'i1');
  expect(sent).toHaveLength(1);
  expect(sent[0].to).toBe('c@d.co');
  expect(sent[0].html).toContain('Service-role key shipped to client');
  expect(sent[0].html).toContain('1 high');
});
