import { describe, expect, test } from 'vitest';
import { parseGitHubRepo, isSpam, admissionDecision } from '../../src/lib/assay/domain';

describe('parseGitHubRepo', () => {
  test.each([
    ['github.com/acme/app', 'acme', 'app'],
    ['https://github.com/acme/app.git', 'acme', 'app'],
    ['https://www.github.com/acme/app/tree/main/src', 'acme', 'app'],
  ])('%s -> %s/%s', (link, owner, repo) => {
    expect(parseGitHubRepo(link)).toEqual({ owner, repo });
  });
  test.each([['lovable.dev/p/xyz'], ['https://my-app.vercel.app'], ['github.com/onlyowner'], ['']])(
    'non-GitHub-repo link %s -> null',
    (link) => expect(parseGitHubRepo(link)).toBeNull(),
  );
});

describe('isSpam', () => {
  test('filled honeypot is spam; empty is not', () => {
    const spam = new FormData();
    spam.set('company', 'Best SEO');
    expect(isSpam(spam)).toBe(true);
    expect(isSpam(new FormData())).toBe(false);
  });
});

describe('admissionDecision', () => {
  test('accepts under caps, queues at either cap', () => {
    expect(admissionDecision({ globalToday: 0, emailToday: 0 })).toBe('accept');
    expect(admissionDecision({ globalToday: 10, emailToday: 0 })).toBe('queue');
    expect(admissionDecision({ globalToday: 3, emailToday: 2 })).toBe('queue');
  });
});
