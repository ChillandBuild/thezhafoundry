import { describe, expect, test } from 'vitest';
import { loadEnv, baseUrl } from '../../src/lib/assay/config';

const FULL = {
  DATABASE_URL: 'postgres://x',
  RESEND_API_KEY: 're_x',
  RESEND_FROM: 'The Zha Foundry <assay@thezhafoundry.com>',
  FOUNDER_EMAIL: 'kanthaiyee@gmail.com',
  ASSAY_RUN_SECRET: 'a-long-internal-secret',
};

describe('loadEnv', () => {
  test('returns parsed env with model default', () => {
    const env = loadEnv(FULL);
    expect(env.ASSAY_MODEL).toBe('anthropic/claude-sonnet-4.5');
    expect(env.FOUNDER_EMAIL).toBe('kanthaiyee@gmail.com');
  });
  test('throws naming every missing var', () => {
    expect(() => loadEnv({})).toThrowError(/DATABASE_URL.*RESEND_API_KEY/s);
  });
});

describe('baseUrl', () => {
  test('uses VERCEL_URL when present, localhost otherwise', () => {
    expect(baseUrl({ VERCEL_URL: 'zha.vercel.app' })).toBe('https://zha.vercel.app');
    expect(baseUrl({})).toBe('http://localhost:3000');
  });
});
