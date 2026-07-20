import { describe, expect, test } from 'vitest';
// Behavior formerly tested here now lives in tests/unit/intake.test.ts against
// processLead with fake deps; submitLead is a thin env-wiring shell around it.
import { processLead, type IntakeDeps } from '../../src/lib/assay/intake';

const idle = { status: 'idle' as const, message: '' };
const noopDeps: IntakeDeps = {
  store: {
    insert: async () => 'x',
    get: async () => null,
    setStatus: async () => {},
    saveReport: async () => {},
    countToday: async () => 0,
    countTodayByEmail: async () => 0,
  },
  notifyFounder: async () => {},
  kickoff: async () => {},
  log: () => {},
};

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe('lead state contract (form-facing)', () => {
  test('error state echoes submitted values so forms can restore them', async () => {
    const res = await processLead(noopDeps, idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'a@b' }));
    expect(res.status).toBe('error');
    expect(res.values).toEqual({ link: 'github.com/a/b', email: 'a@b', name: '', message: '' });
  });
  test('sent state does not echo values (form should clear)', async () => {
    const res = await processLead(noopDeps, idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'a@b.co' }));
    expect(res.status).toBe('sent');
    expect(res.values).toBeUndefined();
  });
});
