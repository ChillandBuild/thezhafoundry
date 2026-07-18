import { describe, expect, test } from 'vitest';
import { selectFiles, parseAuditJson, scanSecrets, MAX_REVIEW_FILES } from '../../src/lib/assay/analysis';

describe('selectFiles', () => {
  test('excludes junk, prioritizes manifests and server code, caps count', () => {
    const list = [
      'package-lock.json', 'node_modules/x/index.js', 'logo.png', '.env.example',
      'package.json', 'app/api/pay/route.ts', 'components/Button.tsx', 'README.md',
      ...Array.from({ length: 60 }, (_, i) => `src/util${i}.ts`),
    ];
    const picked = selectFiles(list);
    expect(picked).not.toContain('package-lock.json');
    expect(picked).not.toContain('node_modules/x/index.js');
    expect(picked).not.toContain('logo.png');
    expect(picked[0]).toBe('package.json');
    expect(picked.indexOf('app/api/pay/route.ts')).toBeLessThan(picked.indexOf('components/Button.tsx'));
    expect(picked.length).toBeLessThanOrEqual(MAX_REVIEW_FILES);
  });
});

describe('parseAuditJson', () => {
  test('reads npm audit vulnerability counts; garbage -> zeros', () => {
    const raw = JSON.stringify({ metadata: { vulnerabilities: { critical: 1, high: 2, moderate: 3, low: 4 } } });
    expect(parseAuditJson(raw)).toEqual({ critical: 1, high: 2, moderate: 3, low: 4 });
    expect(parseAuditJson('not json')).toEqual({ critical: 0, high: 0, moderate: 0, low: 0 });
  });
});

describe('scanSecrets', () => {
  test('flags known key shapes with path and line', () => {
    const hits = scanSecrets([
      { path: 'lib/db.ts', content: 'const k = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.sig"' },
      { path: 'a.ts', content: 'x\nconst s = "sk-proj-abcdef1234567890abcdef1234567890"' },
      { path: 'ok.ts', content: 'const key = process.env.API_KEY' },
    ]);
    expect(hits).toEqual([
      { path: 'lib/db.ts', kind: 'supabase-service-role-jwt', line: 1 },
      { path: 'a.ts', kind: 'openai-key', line: 2 },
    ]);
  });
});
