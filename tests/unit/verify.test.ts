import { expect, test } from 'vitest';
import { verifyFindings } from '../../src/lib/assay/verify';
import type { Finding, GenerateFn, RepoContext } from '../../src/lib/assay/types';

const ctx: RepoContext = {
  repoUrl: 'u',
  fileList: [],
  files: [{ path: 'a.ts', content: 'code' }],
  audit: { critical: 0, high: 0, moderate: 0, low: 0 },
  secretHits: [],
};
const finding = (title: string): Finding => ({
  dimension: 'security', title, severity: 'high', evidence: 'e', recommendation: 'r',
});

test('keeps confirmed, drops refuted, drops on verifier error (fail closed)', async () => {
  const generate: GenerateFn = async ({ prompt }) => {
    if (prompt.includes('KEEP')) return { confirmed: true, reason: 'checked' } as never;
    if (prompt.includes('BOOM')) throw new Error('down');
    return { confirmed: false, reason: 'not reproducible' } as never;
  };
  const dropped: string[] = [];
  const kept = await verifyFindings(
    { generate, log: (m) => dropped.push(m) },
    [finding('KEEP this'), finding('DROP this'), finding('BOOM this')],
    ctx,
  );
  expect(kept.map((f) => f.title)).toEqual(['KEEP this']);
  expect(dropped.filter((m) => m.includes('finding dropped'))).toHaveLength(2);
});
