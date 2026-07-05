import { describe, expect, test } from 'vitest';
import { validateLead } from '../../src/lib/leads';

describe('validateLead', () => {
  test('accepts a valid assay lead', () => {
    const res = validateLead({ kind: 'assay', link: 'github.com/acme/app', email: 'a@b.co' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.lead.kind).toBe('assay');
  });

  test('rejects assay lead with invalid email', () => {
    const res = validateLead({ kind: 'assay', link: 'github.com/acme/app', email: 'nope' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/email/i);
  });

  test('rejects assay lead with empty link', () => {
    const res = validateLead({ kind: 'assay', link: '  ', email: 'a@b.co' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/link/i);
  });

  test('accepts a valid contact lead without a link', () => {
    const res = validateLead({
      kind: 'contact', name: 'Prem', email: 'a@b.co', link: '', message: 'Build my idea.',
    });
    expect(res.ok).toBe(true);
  });

  test('rejects contact lead with empty message', () => {
    const res = validateLead({ kind: 'contact', name: 'Prem', email: 'a@b.co', link: '', message: '' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/message/i);
  });

  test('rejects unknown kind', () => {
    const res = validateLead({ kind: 'spam' });
    expect(res.ok).toBe(false);
  });

  test('unknown kind surfaces friendly copy, not zod internals', () => {
    const res = validateLead({ kind: 'spam' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).not.toMatch(/discriminator|invalid input/i);
      expect(res.error).toMatch(/try again/i);
    }
  });

  test('missing email field surfaces friendly copy, not zod internals', () => {
    const res = validateLead({ kind: 'assay', link: 'github.com/a/b' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/email/i);
      expect(res.error).not.toMatch(/expected string|received undefined/i);
    }
  });

  test('trims whitespace on fields', () => {
    const res = validateLead({ kind: 'assay', link: ' github.com/a/b ', email: ' a@b.co ' });
    expect(res.ok).toBe(true);
    if (res.ok && res.lead.kind === 'assay') expect(res.lead.link).toBe('github.com/a/b');
  });
});
