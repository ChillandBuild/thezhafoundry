import { describe, expect, test } from 'vitest';
import { processLead, type IntakeDeps } from '../../src/lib/assay/intake';

const idle = { status: 'idle' as const, message: '' };

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

function makeFakes(counts = { global: 0, email: 0 }) {
  const calls = {
    inserted: [] as { kind: string; status: string }[],
    founder: [] as string[],
    kicked: [] as string[],
  };
  const deps: IntakeDeps = {
    store: {
      insert: async (sub) => { calls.inserted.push({ kind: sub.kind, status: sub.status }); return 'new-id'; },
      get: async () => null,
      setStatus: async () => {},
      saveReport: async () => {},
      countToday: async () => counts.global,
      countTodayByEmail: async () => counts.email,
    },
    notifyFounder: async (s) => { calls.founder.push(s); },
    kickoff: async (id) => { calls.kicked.push(id); },
    log: () => {},
  };
  return { deps, calls };
}

describe('processLead', () => {
  test('honeypot: pretends success, stores nothing', async () => {
    const { deps, calls } = makeFakes();
    const res = await processLead(deps, idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'a@b.co', company: 'spam co' }));
    expect(res.status).toBe('sent');
    expect(calls.inserted).toEqual([]);
  });
  test('invalid input returns error state, stores nothing', async () => {
    const { deps, calls } = makeFakes();
    const res = await processLead(deps, idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'bad' }));
    expect(res.status).toBe('error');
    expect(calls.inserted).toEqual([]);
  });
  test('contact lead: stored as manual, founder notified, human-reply copy', async () => {
    const { deps, calls } = makeFakes();
    const res = await processLead(deps, idle, fd({ kind: 'contact', name: 'P', email: 'a@b.co', link: '', message: 'hi' }));
    expect(calls.inserted).toEqual([{ kind: 'contact', status: 'manual' }]);
    expect(calls.founder[0]).toMatch(/contact/i);
    expect(res.message).toMatch(/human/i);
  });
  test('GitHub assay under caps: stored pending, kicked off, 48h copy', async () => {
    const { deps, calls } = makeFakes();
    const res = await processLead(deps, idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'a@b.co' }));
    expect(calls.inserted).toEqual([{ kind: 'assay', status: 'pending' }]);
    expect(calls.kicked).toEqual(['new-id']);
    expect(res.message).toMatch(/48 hours/);
  });
  test('non-GitHub assay: stored manual, founder notified, no kickoff', async () => {
    const { deps, calls } = makeFakes();
    await processLead(deps, idle, fd({ kind: 'assay', link: 'my-app.lovable.dev', email: 'a@b.co' }));
    expect(calls.inserted).toEqual([{ kind: 'assay', status: 'manual' }]);
    expect(calls.kicked).toEqual([]);
    expect(calls.founder[0]).toMatch(/manual/i);
  });
  test('over caps: stored queued, founder notified, no kickoff, same client copy', async () => {
    const { deps, calls } = makeFakes({ global: 10, email: 0 });
    const res = await processLead(deps, idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'a@b.co' }));
    expect(calls.inserted).toEqual([{ kind: 'assay', status: 'queued' }]);
    expect(calls.kicked).toEqual([]);
    expect(res.status).toBe('sent');
  });
  test('kickoff failure does not surface to client; founder notified', async () => {
    const { deps, calls } = makeFakes();
    deps.kickoff = async () => { throw new Error('route down'); };
    const res = await processLead(deps, idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'a@b.co' }));
    expect(res.status).toBe('sent');
    expect(calls.founder.some((s) => s.match(/kickoff failed/i))).toBe(true);
  });
});
