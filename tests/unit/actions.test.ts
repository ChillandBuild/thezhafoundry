import { describe, expect, test } from 'vitest';
import { submitLead } from '../../src/app/actions';

const idle = { status: 'idle' as const, message: '' };

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe('submitLead', () => {
  test('valid assay submission returns sent state with 48-hour promise', async () => {
    const res = await submitLead(idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'a@b.co' }));
    expect(res.status).toBe('sent');
    expect(res.message).toMatch(/48 hours/);
  });

  test('valid contact submission returns sent state', async () => {
    const res = await submitLead(
      idle,
      fd({ kind: 'contact', name: 'P', email: 'a@b.co', link: '', message: 'hi' }),
    );
    expect(res.status).toBe('sent');
    expect(res.message).toMatch(/human/i);
  });

  test('invalid submission returns error state with the validation message', async () => {
    const res = await submitLead(idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'bad' }));
    expect(res.status).toBe('error');
    expect(res.message).toMatch(/email/i);
  });
});
