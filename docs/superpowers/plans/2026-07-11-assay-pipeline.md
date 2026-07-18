# Assay Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn an Assay form submission (public GitHub URL + email) into a verified, emailed HTML audit report, replacing the console.log stub in `submitLead`.

**Architecture:** Server action validates + stores the submission, then kicks an internal route (`/api/assay/run`, secret-gated) that responds 202 and runs the pipeline via Next's `after()` within `maxDuration = 300`. The pipeline clones the repo in a Vercel Sandbox, runs static analysis, fans out 4 parallel review agents (AI SDK `generateObject` via AI Gateway), verifies every finding with an independent second call (unconfirmed → dropped), renders an HTML email, and delivers via Resend. All stages take injected deps so unit tests use fakes.

**Tech Stack:** Next.js 16.2.10 (App Router, server actions, `after()`), `@vercel/sandbox`, `ai` (v6, `gateway()` + `generateObject`), `@neondatabase/serverless` (Neon Postgres via Vercel Marketplace), `resend`, `zod` 4, vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-11-assay-pipeline-design.md`. Report is **email-only HTML** (no PDF, no hosted page) for v1.
- Unconfirmed findings are **dropped, never softened**; verifier failures fail closed (finding dropped, logged internally).
- One reviewer failing must not fail the run — report ships with remaining dimensions plus a manual-follow-up note.
- Sandbox/pipeline failure → submission `failed`, founder notified, client gets a "we hit a snag, a human follows up" email. Never silence.
- No `console.log` in production code paths (repo rule). No `any` — use `unknown` + narrowing.
- Client-facing copy: quiet, no exclamation marks, no hype (brand voice in `PRODUCT.md`).
- Tests live in `tests/unit/**/*.test.ts` (vitest, node env). Run with `npm test`.
- All new server code under `src/lib/assay/` (one responsibility per file); nothing assay-specific in components.
- Every model/email/repo string interpolated into HTML goes through `escapeHtml`.

## File Structure

```
src/lib/assay/
  config.ts      env loading (zod-validated) + baseUrl
  types.ts       Dimension, Finding, Submission, RepoContext, deps interfaces
  domain.ts      parseGitHubRepo, isSpam, admissionDecision (pure)
  analysis.ts    selectFiles, parseAuditJson, scanSecrets (pure)
  sandbox.ts     collectRepo (Vercel Sandbox; thin shell around analysis.ts)
  model.ts       makeGenerate (AI SDK wrapper)
  review.ts      finding schema, rubrics, runReviewers
  verify.ts      verdict schema, verifyFindings
  report.ts      escapeHtml, renderReportEmail, renderSnagEmail
  pipeline.ts    runAssayPipeline orchestrator
  intake.ts      processLead (form → store → kickoff)
  store.ts       Neon SubmissionStore
  deps.ts        default production deps factories
src/app/api/assay/run/route.ts   secret-gated 202 + after() runner
scripts/migrations/001-assay-submissions.sql
tests/unit/{domain,analysis,review,verify,report,pipeline,intake}.test.ts
tests/fixtures/leaky-app/        planted-flaw fixture repo
```

---

### Task 1: Dependencies + env config

**Files:**
- Modify: `package.json` (via npm install)
- Create: `src/lib/assay/config.ts`
- Test: `tests/unit/config.test.ts`

**Interfaces:**
- Produces: `loadEnv(source?): AssayEnv` (throws listing missing vars), `baseUrl(source?): string`, type `AssayEnv`.

- [ ] **Step 1: Install dependencies**

```bash
npm install @vercel/sandbox ai @neondatabase/serverless resend
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/unit/config.test.ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/unit/config.test.ts`
Expected: FAIL — cannot resolve `src/lib/assay/config`.

- [ ] **Step 4: Implement**

```ts
// src/lib/assay/config.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().min(1),
  FOUNDER_EMAIL: z.string().email(),
  ASSAY_RUN_SECRET: z.string().min(16),
  ASSAY_MODEL: z.string().default('anthropic/claude-sonnet-4.5'),
});

export type AssayEnv = z.infer<typeof envSchema>;
type EnvSource = Record<string, string | undefined>;

export function loadEnv(source: EnvSource = process.env): AssayEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Assay pipeline misconfigured — check env vars: ${missing}`);
  }
  return parsed.data;
}

export function baseUrl(source: EnvSource = process.env): string {
  return source.VERCEL_URL ? `https://${source.VERCEL_URL}` : 'http://localhost:3000';
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/config.test.ts` — Expected: PASS (regex spans both names because issues list preserves schema order).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/assay/config.ts tests/unit/config.test.ts
git commit -m "feat: assay env config + pipeline dependencies"
```

---

### Task 2: Types + pure domain logic

**Files:**
- Create: `src/lib/assay/types.ts`, `src/lib/assay/domain.ts`
- Test: `tests/unit/domain.test.ts`

**Interfaces:**
- Produces (types.ts):

```ts
export type Dimension = 'security' | 'correctness' | 'architecture' | 'quality';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export interface Finding {
  dimension: Dimension; title: string; severity: Severity;
  file?: string; evidence: string; recommendation: string;
}
export type SubmissionStatus = 'pending' | 'running' | 'sent' | 'failed' | 'queued' | 'manual';
export interface Submission {
  id: string; kind: 'assay' | 'contact'; email: string; link: string;
  name: string; message: string; status: SubmissionStatus; createdAt: string;
}
export interface AuditSummary { critical: number; high: number; moderate: number; low: number }
export interface SecretHit { path: string; kind: string; line: number }
export interface RepoFile { path: string; content: string }
export interface RepoContext {
  repoUrl: string; fileList: string[]; files: RepoFile[];
  audit: AuditSummary; secretHits: SecretHit[];
}
export interface ReviewResult { dimension: Dimension; ok: boolean; findings: Finding[] }
export interface SubmissionStore {
  insert(sub: Pick<Submission, 'kind' | 'email' | 'link' | 'name' | 'message' | 'status'>): Promise<string>;
  get(id: string): Promise<Submission | null>;
  setStatus(id: string, status: SubmissionStatus, detail?: string): Promise<void>;
  saveReport(id: string, html: string, findings: Finding[]): Promise<void>;
  countToday(): Promise<number>;
  countTodayByEmail(email: string): Promise<number>;
}
export type GenerateFn = <T>(args: { schema: import('zod').ZodType<T>; prompt: string }) => Promise<T>;
export interface AssayDeps {
  store: SubmissionStore;
  sendEmail(msg: { to: string; subject: string; html: string }): Promise<void>;
  notifyFounder(subject: string, body: string): Promise<void>;
  generate: GenerateFn;
  collectRepo(repoUrl: string): Promise<RepoContext>;
  log(message: string, data?: unknown): void;
}
```

- Produces (domain.ts): `parseGitHubRepo(link): { owner: string; repo: string } | null`, `isSpam(formData: FormData): boolean` (honeypot field name `company`), `admissionDecision(counts: { globalToday: number; emailToday: number }): 'accept' | 'queue'` with `GLOBAL_DAILY_CAP = 10`, `PER_EMAIL_DAILY_CAP = 2`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/domain.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/domain.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/lib/assay/types.ts` with exactly the block from **Interfaces** above, then:

```ts
// src/lib/assay/domain.ts
export const GLOBAL_DAILY_CAP = 10;
export const PER_EMAIL_DAILY_CAP = 2;

const GITHUB_RE = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/i;

export function parseGitHubRepo(link: string): { owner: string; repo: string } | null {
  const match = GITHUB_RE.exec(link.trim());
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export function isSpam(formData: FormData): boolean {
  return String(formData.get('company') ?? '').trim() !== '';
}

export function admissionDecision(counts: { globalToday: number; emailToday: number }): 'accept' | 'queue' {
  if (counts.globalToday >= GLOBAL_DAILY_CAP) return 'queue';
  if (counts.emailToday >= PER_EMAIL_DAILY_CAP) return 'queue';
  return 'accept';
}
```

- [ ] **Step 4: Run test to verify it passes** — `npm test -- tests/unit/domain.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/assay/types.ts src/lib/assay/domain.ts tests/unit/domain.test.ts
git commit -m "feat: assay types and pure domain logic (repo parse, honeypot, admission caps)"
```

---

### Task 3: Submission store (Neon)

**Files:**
- Create: `scripts/migrations/001-assay-submissions.sql`, `src/lib/assay/store.ts`
- Test: none automated (thin SQL wrapper; logic already tested via `admissionDecision`). Manual verify step below.

**Interfaces:**
- Consumes: `SubmissionStore`, `Submission` from `types.ts`.
- Produces: `makeStore(databaseUrl: string): SubmissionStore`.

- [ ] **Step 1: Provision Neon (manual, founder)**

In the Vercel dashboard for project `premkannan/thezhafoundry`: Storage → Create Database → Neon Postgres (Marketplace). This injects `DATABASE_URL` into the project env. Pull locally: `npx vercel env pull .env.local` (install the CLI first if missing: `npm i -g vercel`).

- [ ] **Step 2: Migration**

```sql
-- scripts/migrations/001-assay-submissions.sql
create table if not exists assay_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('assay', 'contact')),
  email text not null,
  link text not null default '',
  name text not null default '',
  message text not null default '',
  status text not null,
  detail text not null default '',
  report_html text,
  findings jsonb,
  created_at timestamptz not null default now()
);
create index if not exists assay_submissions_created_at_idx on assay_submissions (created_at);
```

Apply it from the Neon console SQL editor (paste the file) or `psql "$DATABASE_URL" -f scripts/migrations/001-assay-submissions.sql`.

- [ ] **Step 3: Implement store**

```ts
// src/lib/assay/store.ts
import { neon } from '@neondatabase/serverless';
import type { Finding, Submission, SubmissionStatus, SubmissionStore } from './types';

type Row = Record<string, unknown>;

function toSubmission(row: Row): Submission {
  return {
    id: String(row.id),
    kind: row.kind === 'contact' ? 'contact' : 'assay',
    email: String(row.email),
    link: String(row.link),
    name: String(row.name),
    message: String(row.message),
    status: String(row.status) as SubmissionStatus,
    createdAt: String(row.created_at),
  };
}

export function makeStore(databaseUrl: string): SubmissionStore {
  const sql = neon(databaseUrl);
  return {
    async insert(sub) {
      const rows = await sql`
        insert into assay_submissions (kind, email, link, name, message, status)
        values (${sub.kind}, ${sub.email}, ${sub.link}, ${sub.name}, ${sub.message}, ${sub.status})
        returning id`;
      return String(rows[0].id);
    },
    async get(id) {
      const rows = await sql`select * from assay_submissions where id = ${id}`;
      return rows.length > 0 ? toSubmission(rows[0]) : null;
    },
    async setStatus(id, status, detail = '') {
      await sql`update assay_submissions set status = ${status}, detail = ${detail} where id = ${id}`;
    },
    async saveReport(id, html, findings: Finding[]) {
      await sql`update assay_submissions
        set report_html = ${html}, findings = ${JSON.stringify(findings)}::jsonb where id = ${id}`;
    },
    async countToday() {
      const rows = await sql`select count(*)::int as n from assay_submissions
        where kind = 'assay' and created_at > now() - interval '24 hours'`;
      return Number(rows[0].n);
    },
    async countTodayByEmail(email) {
      const rows = await sql`select count(*)::int as n from assay_submissions
        where kind = 'assay' and email = ${email} and created_at > now() - interval '24 hours'`;
      return Number(rows[0].n);
    },
  };
}
```

- [ ] **Step 4: Manual verify**

```bash
npx tsx -e "import { makeStore } from './src/lib/assay/store'; import 'dotenv/config';
const s = makeStore(process.env.DATABASE_URL!);
s.insert({ kind: 'assay', email: 'smoke@test.dev', link: 'github.com/a/b', name: '', message: '', status: 'manual' })
  .then(async (id) => { console.log('inserted', id, await s.get(id)); });"
```

Expected: prints the new id and a `Submission` with `status: 'manual'`. Delete the row afterwards in the Neon console (`delete from assay_submissions where email = 'smoke@test.dev'`).

- [ ] **Step 5: Commit**

```bash
git add scripts/migrations/001-assay-submissions.sql src/lib/assay/store.ts
git commit -m "feat: assay submission store on Neon Postgres"
```

---

### Task 4: Static analysis (pure)

**Files:**
- Create: `src/lib/assay/analysis.ts`
- Test: `tests/unit/analysis.test.ts`

**Interfaces:**
- Consumes: `AuditSummary`, `SecretHit`, `RepoFile` from `types.ts`.
- Produces: `selectFiles(fileList: string[]): string[]` (caps `MAX_REVIEW_FILES = 40`), `parseAuditJson(raw: string): AuditSummary`, `scanSecrets(files: RepoFile[]): SecretHit[]`, `MAX_TOTAL_CHARS = 180_000`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/analysis.test.ts
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
```

- [ ] **Step 2: Run to verify FAIL** — `npm test -- tests/unit/analysis.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/lib/assay/analysis.ts
import type { AuditSummary, RepoFile, SecretHit } from './types';

export const MAX_REVIEW_FILES = 40;
export const MAX_TOTAL_CHARS = 180_000;

const EXCLUDE = /(^|\/)(node_modules|dist|build|\.next|\.git)\/|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$|\.(png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|mp4|pdf|lock|min\.js|map)$/i;

function priority(path: string): number {
  if (/^package\.json$/.test(path)) return 0;
  if (/(^|\/)(next|vercel|tsconfig|\.env\.example)[^/]*$/i.test(path)) return 1;
  if (/(^|\/)(api|server|actions|middleware|proxy|auth|db|lib)\b/i.test(path)) return 2;
  if (/\.(ts|tsx|js|jsx|mjs|py|sql|prisma|toml|ya?ml|json)$/i.test(path)) return 3;
  return 4;
}

export function selectFiles(fileList: string[]): string[] {
  return fileList
    .filter((p) => !EXCLUDE.test(p))
    .map((path, i) => ({ path, rank: priority(path), i }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .slice(0, MAX_REVIEW_FILES)
    .map((f) => f.path);
}

export function parseAuditJson(raw: string): AuditSummary {
  const zero: AuditSummary = { critical: 0, high: 0, moderate: 0, low: 0 };
  try {
    const parsed: unknown = JSON.parse(raw);
    const v = (parsed as { metadata?: { vulnerabilities?: Record<string, unknown> } })?.metadata?.vulnerabilities;
    if (!v) return zero;
    return {
      critical: Number(v.critical ?? 0), high: Number(v.high ?? 0),
      moderate: Number(v.moderate ?? 0), low: Number(v.low ?? 0),
    };
  } catch { return zero; }
}

const SECRET_PATTERNS: ReadonlyArray<{ kind: string; re: RegExp }> = [
  { kind: 'supabase-service-role-jwt', re: /eyJ[\w-]+\.[\w-]*c2VydmljZV9yb2xl[\w-]*\.[\w-]+/ },
  { kind: 'openai-key', re: /sk-[a-zA-Z0-9-]{20,}/ },
  { kind: 'anthropic-key', re: /sk-ant-[a-zA-Z0-9-]{20,}/ },
  { kind: 'aws-access-key', re: /AKIA[0-9A-Z]{16}/ },
  { kind: 'private-key-block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { kind: 'stripe-secret', re: /sk_live_[a-zA-Z0-9]{16,}/ },
];

export function scanSecrets(files: RepoFile[]): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const file of files) {
    const lines = file.content.split('\n');
    for (const { kind, re } of SECRET_PATTERNS) {
      const lineIndex = lines.findIndex((l) => re.test(l));
      if (lineIndex >= 0) hits.push({ path: file.path, kind, line: lineIndex + 1 });
    }
  }
  return hits;
}
```

Note: the OpenAI pattern also matches the Anthropic one; ordering in `SECRET_PATTERNS` means both may hit a line — acceptable (one hit per pattern per file, first line only; this is a tripwire, not a full scanner).

- [ ] **Step 4: Run to verify PASS**, then commit:

```bash
git add src/lib/assay/analysis.ts tests/unit/analysis.test.ts
git commit -m "feat: assay static analysis - file selection, audit parse, secret tripwires"
```

---

### Task 5: Sandbox repo collection

**Files:**
- Create: `src/lib/assay/sandbox.ts`
- Test: none automated (thin I/O shell; pure logic lives in analysis.ts). Verified by Task 12's live script.

**Interfaces:**
- Consumes: `selectFiles`, `parseAuditJson`, `scanSecrets`, `MAX_TOTAL_CHARS`; `RepoContext`.
- Produces: `collectRepo(repoUrl: string): Promise<RepoContext>` — matches `AssayDeps['collectRepo']`.

- [ ] **Step 1: Implement**

```ts
// src/lib/assay/sandbox.ts
import { Sandbox } from '@vercel/sandbox';
import { MAX_TOTAL_CHARS, parseAuditJson, scanSecrets, selectFiles } from './analysis';
import type { RepoContext, RepoFile } from './types';

const PER_FILE_CHAR_CAP = 20_000;

function shellQuote(path: string): string {
  return `'${path.replaceAll("'", `'\\''`)}'`;
}

export async function collectRepo(repoUrl: string): Promise<RepoContext> {
  const sandbox = await Sandbox.create({ runtime: 'node24', timeout: 240_000 });
  try {
    await sandbox.runCommand('git', ['clone', '--depth', '1', repoUrl, 'repo']);
    const guard = await sandbox.runCommand('sh', ['-c', 'test -d repo/.git && echo ok']);
    if ((await guard.stdout()).trim() !== 'ok') {
      throw new Error(`clone failed for ${repoUrl} — repo missing, private, or unreachable`);
    }
    const ls = await sandbox.runCommand('sh', ['-c', 'cd repo && git ls-files']);
    const fileList = (await ls.stdout()).split('\n').filter(Boolean);

    const files: RepoFile[] = [];
    let budget = MAX_TOTAL_CHARS;
    for (const path of selectFiles(fileList)) {
      if (budget <= 0) break;
      const cap = Math.min(PER_FILE_CHAR_CAP, budget);
      const cat = await sandbox.runCommand('sh', ['-c', `cd repo && head -c ${cap} -- ${shellQuote(path)}`]);
      const content = await cat.stdout();
      files.push({ path, content });
      budget -= content.length;
    }

    const audit = await sandbox.runCommand('sh', [
      '-c',
      'cd repo && { [ -f package-lock.json ] && npm audit --json --package-lock-only 2>/dev/null; } || echo {}',
    ]);

    return {
      repoUrl, fileList, files,
      audit: parseAuditJson(await audit.stdout()),
      secretHits: scanSecrets(files),
    };
  } finally {
    await sandbox.stop();
  }
}
```

Isolation rationale (from spec): everything that touches untrusted repo content — clone, file reads, `npm audit` parsing its lockfile — happens inside the microVM; only captured strings leave it. Auth is automatic via OIDC when deployed on Vercel; local runs need `VERCEL_TOKEN`/`VERCEL_TEAM_ID`/`VERCEL_PROJECT_ID` (see `@vercel/sandbox` docs).

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` — Expected: clean.

```bash
git add src/lib/assay/sandbox.ts
git commit -m "feat: assay sandbox repo collection via Vercel Sandbox"
```

---

### Task 6: Review agents

**Files:**
- Create: `src/lib/assay/model.ts`, `src/lib/assay/review.ts`
- Test: `tests/unit/review.test.ts`

**Interfaces:**
- Consumes: `GenerateFn`, `RepoContext`, `ReviewResult`, `Dimension`, `Finding`.
- Produces: `makeGenerate(model: string): GenerateFn`; `runReviewers(deps: Pick<AssayDeps, 'generate' | 'log'>, ctx: RepoContext): Promise<ReviewResult[]>`; `DIMENSIONS: readonly Dimension[]`; `findingsSchema`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/review.test.ts
import { describe, expect, test } from 'vitest';
import { runReviewers, DIMENSIONS, buildReviewPrompt } from '../../src/lib/assay/review';
import type { GenerateFn, RepoContext } from '../../src/lib/assay/types';

const ctx: RepoContext = {
  repoUrl: 'https://github.com/a/b', fileList: ['index.ts'],
  files: [{ path: 'index.ts', content: 'export const x = 1;' }],
  audit: { critical: 1, high: 0, moderate: 0, low: 0 }, secretHits: [],
};

test('runs all four dimensions in parallel and tags findings', async () => {
  const generate: GenerateFn = async () =>
    ({ findings: [{ title: 'T', severity: 'high', evidence: 'E', recommendation: 'R' }] }) as never;
  const results = await runReviewers({ generate, log: () => {} }, ctx);
  expect(results.map((r) => r.dimension)).toEqual([...DIMENSIONS]);
  expect(results.every((r) => r.ok && r.findings[0].dimension === r.dimension)).toBe(true);
});

test('one failing dimension is isolated, others survive', async () => {
  const generate: GenerateFn = async ({ prompt }) => {
    if (prompt.includes('SECURITY REVIEW')) throw new Error('model down');
    return { findings: [] } as never;
  };
  const logged: string[] = [];
  const results = await runReviewers({ generate, log: (m) => logged.push(m) }, ctx);
  expect(results.find((r) => r.dimension === 'security')?.ok).toBe(false);
  expect(results.filter((r) => r.ok)).toHaveLength(3);
  expect(logged.some((m) => m.includes('reviewer failed'))).toBe(true);
});

test('prompt carries repo evidence: files, audit counts, rubric', () => {
  const prompt = buildReviewPrompt('security', ctx);
  expect(prompt).toContain('SECURITY REVIEW');
  expect(prompt).toContain('index.ts');
  expect(prompt).toContain('"critical": 1');
});
```

- [ ] **Step 2: Run to verify FAIL** — `npm test -- tests/unit/review.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/lib/assay/model.ts
import { gateway, generateObject } from 'ai';
import type { GenerateFn } from './types';

export function makeGenerate(model: string): GenerateFn {
  return async ({ schema, prompt }) => {
    const { object } = await generateObject({ model: gateway(model), schema, prompt });
    return object;
  };
}
```

```ts
// src/lib/assay/review.ts
import { z } from 'zod';
import type { AssayDeps, Dimension, Finding, RepoContext, ReviewResult } from './types';

export const DIMENSIONS = ['security', 'correctness', 'architecture', 'quality'] as const;

export const findingsSchema = z.object({
  findings: z.array(
    z.object({
      title: z.string().max(120),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      file: z.string().optional(),
      evidence: z.string().max(1000),
      recommendation: z.string().max(600),
    }),
  ).max(8),
});

const RUBRICS: Record<Dimension, string> = {
  security: `SECURITY REVIEW. Hunt only for: exposed or hardcoded secrets (especially Supabase service-role keys in client code), missing/permissive Row Level Security, API routes reachable without auth, injection risks, unvalidated input reaching queries or shell, dependency CVEs (audit counts provided).`,
  correctness: `CORRECTNESS REVIEW. Hunt only for: server-side validation missing (client-only validation), silently swallowed errors, unhandled promise rejections, broken logic paths, missing error boundaries, optimistic updates without rollback.`,
  architecture: `ARCHITECTURE REVIEW. Hunt only for: N+1 query patterns, unbounded queries without pagination, missing rate limiting on mutation endpoints, tight coupling that blocks scaling, missing indexes implied by query patterns.`,
  quality: `QUALITY REVIEW. Hunt only for: absent test coverage, dead code, significant duplication, files/functions too large to maintain, dependency bloat.`,
};

export function buildReviewPrompt(dimension: Dimension, ctx: RepoContext): string {
  const fileDump = ctx.files.map((f) => `=== ${f.path} ===\n${f.content}`).join('\n\n');
  return [
    RUBRICS[dimension],
    `You are auditing ${ctx.repoUrl} for a paid-grade independent report. Report ONLY defects you can point to in the provided files — no speculation, no praise, no generic advice. Each finding needs concrete evidence (file + what the code does wrong). If the provided files show nothing for this dimension, return an empty findings list.`,
    `npm audit summary: ${JSON.stringify(ctx.audit, null, 1)}`,
    `Secret scan hits: ${JSON.stringify(ctx.secretHits)}`,
    `Full file list:\n${ctx.fileList.join('\n')}`,
    `File contents:\n${fileDump}`,
  ].join('\n\n');
}

export async function runReviewers(
  deps: Pick<AssayDeps, 'generate' | 'log'>,
  ctx: RepoContext,
): Promise<ReviewResult[]> {
  return Promise.all(
    DIMENSIONS.map(async (dimension): Promise<ReviewResult> => {
      try {
        const { findings } = await deps.generate({
          schema: findingsSchema,
          prompt: buildReviewPrompt(dimension, ctx),
        });
        const tagged: Finding[] = findings.map((f) => ({ ...f, dimension }));
        return { dimension, ok: true, findings: tagged };
      } catch (error: unknown) {
        deps.log(`reviewer failed: ${dimension}`, error);
        return { dimension, ok: false, findings: [] };
      }
    }),
  );
}
```

- [ ] **Step 4: Run to verify PASS**, then commit:

```bash
git add src/lib/assay/model.ts src/lib/assay/review.ts tests/unit/review.test.ts
git commit -m "feat: assay review agents - 4 parallel dimensions with failure isolation"
```

---

### Task 7: Verifier

**Files:**
- Create: `src/lib/assay/verify.ts`
- Test: `tests/unit/verify.test.ts`

**Interfaces:**
- Consumes: `Finding`, `RepoContext`, `GenerateFn`.
- Produces: `verifyFindings(deps: Pick<AssayDeps, 'generate' | 'log'>, findings: Finding[], ctx: RepoContext): Promise<Finding[]>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/verify.test.ts
import { expect, test } from 'vitest';
import { verifyFindings } from '../../src/lib/assay/verify';
import type { Finding, GenerateFn, RepoContext } from '../../src/lib/assay/types';

const ctx: RepoContext = {
  repoUrl: 'u', fileList: [], files: [{ path: 'a.ts', content: 'code' }],
  audit: { critical: 0, high: 0, moderate: 0, low: 0 }, secretHits: [],
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
```

- [ ] **Step 2: Run to verify FAIL** — `npm test -- tests/unit/verify.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/lib/assay/verify.ts
import { z } from 'zod';
import type { AssayDeps, Finding, RepoContext } from './types';

const verdictSchema = z.object({ confirmed: z.boolean(), reason: z.string().max(500) });

function buildVerifyPrompt(finding: Finding, ctx: RepoContext): string {
  const file = ctx.files.find((f) => f.path === finding.file);
  return [
    `You are an independent verifier. Your default position is SKEPTICAL: confirm this finding only if the evidence in the provided code genuinely supports it. If you cannot verify it from what is shown, refute it.`,
    `Finding under review (${finding.dimension}/${finding.severity}): ${finding.title}`,
    `Claimed evidence: ${finding.evidence}`,
    file ? `Cited file ${file.path}:\n${file.content}` : `No cited file. Repo file list:\n${ctx.fileList.join('\n')}`,
  ].join('\n\n');
}

export async function verifyFindings(
  deps: Pick<AssayDeps, 'generate' | 'log'>,
  findings: Finding[],
  ctx: RepoContext,
): Promise<Finding[]> {
  const verdicts = await Promise.all(
    findings.map(async (finding): Promise<Finding | null> => {
      try {
        const verdict = await deps.generate({ schema: verdictSchema, prompt: buildVerifyPrompt(finding, ctx) });
        if (verdict.confirmed) return finding;
        deps.log(`finding dropped (refuted): ${finding.title}`, verdict.reason);
        return null;
      } catch (error: unknown) {
        deps.log(`finding dropped (verifier error): ${finding.title}`, error);
        return null;
      }
    }),
  );
  return verdicts.filter((f): f is Finding => f !== null);
}
```

- [ ] **Step 4: Run to verify PASS**, then commit:

```bash
git add src/lib/assay/verify.ts tests/unit/verify.test.ts
git commit -m "feat: assay verifier pass - skeptical re-check, fail-closed drops"
```

---

### Task 8: Report rendering

**Files:**
- Create: `src/lib/assay/report.ts`
- Test: `tests/unit/report.test.ts`

**Interfaces:**
- Consumes: `Submission`, `ReviewResult`, `Finding`, `RepoContext`.
- Produces: `escapeHtml(s: string): string`, `renderReportEmail(args: { submission: Submission; results: ReviewResult[]; verified: Finding[]; ctx: RepoContext }): string`, `renderSnagEmail(): string`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/report.test.ts
import { describe, expect, test } from 'vitest';
import { escapeHtml, renderReportEmail, renderSnagEmail } from '../../src/lib/assay/report';
import type { Finding, ReviewResult, RepoContext, Submission } from '../../src/lib/assay/types';

const sub: Submission = {
  id: '1', kind: 'assay', email: 'a@b.co', link: 'github.com/a/b',
  name: '', message: '', status: 'running', createdAt: 'now',
};
const ctx: RepoContext = {
  repoUrl: 'https://github.com/a/b', fileList: ['x.ts'], files: [],
  audit: { critical: 2, high: 0, moderate: 0, low: 0 }, secretHits: [],
};
const ok = (d: ReviewResult['dimension'], findings: Finding[] = []): ReviewResult =>
  ({ dimension: d, ok: true, findings });

test('escapeHtml neutralizes markup', () => {
  expect(escapeHtml(`<img src=x onerror="a&b">'`)).toBe('&lt;img src=x onerror=&quot;a&amp;b&quot;&gt;&#39;');
});

describe('renderReportEmail', () => {
  const finding: Finding = {
    dimension: 'security', title: '<script>bad</script>', severity: 'critical',
    file: 'lib/db.ts', evidence: 'service role key in client bundle', recommendation: 'move to server env',
  };
  test('renders four sections, escapes model output, includes audit counts', () => {
    const html = renderReportEmail({
      submission: sub, verified: [finding], ctx,
      results: [ok('security', [finding]), ok('correctness'), ok('architecture'), ok('quality')],
    });
    expect(html).toContain('Security &amp; secrets');
    expect(html).toContain('Correctness');
    expect(html).toContain('&lt;script&gt;bad&lt;/script&gt;');
    expect(html).not.toContain('<script>bad');
    expect(html).toContain('2 critical');
  });
  test('failed dimension gets manual follow-up note; clean dimension states no findings', () => {
    const html = renderReportEmail({
      submission: sub, verified: [], ctx,
      results: [{ dimension: 'security', ok: false, findings: [] }, ok('correctness'), ok('architecture'), ok('quality')],
    });
    expect(html).toMatch(/security.*read by a human and follows separately/is);
    expect(html).toMatch(/no confirmed findings/i);
  });
});

test('snag email is quiet and promises human follow-up', () => {
  const html = renderSnagEmail();
  expect(html).toMatch(/human/i);
  expect(html).not.toContain('!');
});
```

- [ ] **Step 2: Run to verify FAIL** — `npm test -- tests/unit/report.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/lib/assay/report.ts
import type { Dimension, Finding, RepoContext, ReviewResult, Submission } from './types';

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const SECTION_TITLES: Record<Dimension, string> = {
  security: 'Security & secrets',
  correctness: 'Correctness & error handling',
  architecture: 'Architecture & scale',
  quality: 'Code quality & maintainability',
};

const STYLE = 'font-family: Georgia, serif; color: #1a1a1a; max-width: 640px; margin: 0 auto; line-height: 1.55;';

function renderFinding(f: Finding): string {
  return `<div style="border-left: 3px solid #8a2b0d; padding: 8px 14px; margin: 12px 0;">
    <p style="margin:0;"><strong>[${escapeHtml(f.severity.toUpperCase())}]</strong> ${escapeHtml(f.title)}${f.file ? ` — <code>${escapeHtml(f.file)}</code>` : ''}</p>
    <p style="margin:6px 0 0;">${escapeHtml(f.evidence)}</p>
    <p style="margin:6px 0 0; color:#444;">Recommended: ${escapeHtml(f.recommendation)}</p>
  </div>`;
}

function renderSection(result: ReviewResult, verified: Finding[]): string {
  const title = `<h2 style="font-size:17px; border-bottom:1px solid #ccc; padding-bottom:4px;">${SECTION_TITLES[result.dimension]}</h2>`;
  if (!result.ok) {
    return `${title}<p>This dimension of the assay is being read by a human and follows separately.</p>`;
  }
  const mine = verified.filter((f) => f.dimension === result.dimension);
  if (mine.length === 0) return `${title}<p>No confirmed findings in the material provided.</p>`;
  return title + mine.map(renderFinding).join('');
}

export function renderReportEmail(args: {
  submission: Submission; results: ReviewResult[]; verified: Finding[]; ctx: RepoContext;
}): string {
  const { audit } = args.ctx;
  const auditLine = `${audit.critical} critical, ${audit.high} high, ${audit.moderate} moderate, ${audit.low} low known dependency vulnerabilities.`;
  return `<div style="${STYLE}">
    <p style="letter-spacing:2px; font-size:12px; color:#666;">THE ZHA FOUNDRY — ASSAY REPORT</p>
    <p>Specimen: <code>${escapeHtml(args.submission.link)}</code></p>
    <p>${auditLine} Every finding below was independently re-verified before inclusion; anything that could not be confirmed was left out rather than hedged.</p>
    ${args.results.map((r) => renderSection(r, args.verified)).join('')}
    <p style="margin-top:28px;">Read and signed by a human before sending. Reply to this email to talk through any finding, or to have us forge the fixes.</p>
  </div>`;
}

export function renderSnagEmail(): string {
  return `<div style="${STYLE}">
    <p style="letter-spacing:2px; font-size:12px; color:#666;">THE ZHA FOUNDRY</p>
    <p>Your assay hit a snag on our side — likely the repository is private, moved, or too large for the automated pass.</p>
    <p>A human has been notified and will follow up personally within one working day. Nothing is needed from you.</p>
  </div>`;
}
```

- [ ] **Step 4: Run to verify PASS**, then commit:

```bash
git add src/lib/assay/report.ts tests/unit/report.test.ts
git commit -m "feat: assay report email rendering with escaped model output"
```

---

### Task 9: Pipeline orchestrator

**Files:**
- Create: `src/lib/assay/pipeline.ts`
- Test: `tests/unit/pipeline.test.ts`

**Interfaces:**
- Consumes: everything above via `AssayDeps`.
- Produces: `runAssayPipeline(deps: AssayDeps, submissionId: string): Promise<void>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/pipeline.test.ts
import { beforeEach, describe, expect, test } from 'vitest';
import { runAssayPipeline } from '../../src/lib/assay/pipeline';
import type { AssayDeps, Finding, RepoContext, Submission, SubmissionStatus } from '../../src/lib/assay/types';

const ctx: RepoContext = {
  repoUrl: 'https://github.com/a/b.git', fileList: ['x.ts'],
  files: [{ path: 'x.ts', content: 'c' }],
  audit: { critical: 0, high: 0, moderate: 0, low: 0 }, secretHits: [],
};
const sub: Submission = {
  id: 'id1', kind: 'assay', email: 'a@b.co', link: 'github.com/a/b',
  name: '', message: '', status: 'pending', createdAt: 'now',
};

function makeFakes(overrides: Partial<AssayDeps> = {}) {
  const calls = { emails: [] as { to: string; subject: string }[], founder: [] as string[], statuses: [] as SubmissionStatus[] };
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
```

- [ ] **Step 2: Run to verify FAIL** — `npm test -- tests/unit/pipeline.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/lib/assay/pipeline.ts
import { renderReportEmail, renderSnagEmail } from './report';
import { runReviewers } from './review';
import { verifyFindings } from './verify';
import type { AssayDeps, RepoContext } from './types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}

function cloneUrl(link: string): string {
  const trimmed = link.trim().replace(/^(?!https?:\/\/)/, 'https://');
  return trimmed.endsWith('.git') ? trimmed : `${trimmed.replace(/\/+$/, '')}.git`;
}

export async function runAssayPipeline(deps: AssayDeps, submissionId: string): Promise<void> {
  const submission = await deps.store.get(submissionId);
  if (!submission || submission.kind !== 'assay') return;
  await deps.store.setStatus(submissionId, 'running');

  let ctx: RepoContext;
  try {
    ctx = await deps.collectRepo(cloneUrl(submission.link));
  } catch (error: unknown) {
    const detail = errorMessage(error);
    await deps.store.setStatus(submissionId, 'failed', detail);
    await deps.sendEmail({
      to: submission.email,
      subject: 'Your assay hit a snag — a human follows up',
      html: renderSnagEmail(),
    });
    await deps.notifyFounder('Assay failed (sandbox)', `${submission.email} · ${submission.link} · ${detail}`);
    return;
  }

  try {
    const results = await runReviewers(deps, ctx);
    const verified = await verifyFindings(deps, results.flatMap((r) => r.findings), ctx);
    const html = renderReportEmail({ submission, results, verified, ctx });
    await deps.store.saveReport(submissionId, html, verified);
    await deps.sendEmail({ to: submission.email, subject: 'Your assay report — The Zha Foundry', html });
    await deps.store.setStatus(submissionId, 'sent');
    await deps.notifyFounder(
      'Assay sent',
      `${submission.email} · ${submission.link} · ${verified.length} confirmed findings · dimensions ok: ${results.filter((r) => r.ok).length}/4`,
    );
  } catch (error: unknown) {
    const detail = errorMessage(error);
    await deps.store.setStatus(submissionId, 'failed', detail);
    await deps.notifyFounder('Assay failed (pipeline)', `${submission.email} · ${submission.link} · ${detail}`);
  }
}
```

- [ ] **Step 4: Run to verify PASS**, then commit:

```bash
git add src/lib/assay/pipeline.ts tests/unit/pipeline.test.ts
git commit -m "feat: assay pipeline orchestrator with spec error paths"
```

---

### Task 10: Default deps + run route

**Files:**
- Create: `src/lib/assay/deps.ts`, `src/app/api/assay/run/route.ts`
- Test: covered by prior unit tests (route is thin glue); manual curl check below.

**Interfaces:**
- Consumes: `makeStore`, `makeGenerate`, `collectRepo`, `loadEnv`, `runAssayPipeline`.
- Produces: `defaultDeps(): AssayDeps`; route `POST /api/assay/run` — headers `x-assay-secret`, JSON body `{ submissionId: string }`, responds 202/400/403.

- [ ] **Step 1: Implement deps factory**

```ts
// src/lib/assay/deps.ts
import { Resend } from 'resend';
import { loadEnv } from './config';
import { makeGenerate } from './model';
import { collectRepo } from './sandbox';
import { makeStore } from './store';
import type { AssayDeps } from './types';

export function defaultDeps(): AssayDeps {
  const env = loadEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const sendEmail: AssayDeps['sendEmail'] = async ({ to, subject, html }) => {
    const { error } = await resend.emails.send({ from: env.RESEND_FROM, to, subject, html });
    if (error) throw new Error(`resend: ${error.message}`);
  };
  return {
    store: makeStore(env.DATABASE_URL),
    sendEmail,
    notifyFounder: (subject, body) =>
      sendEmail({ to: env.FOUNDER_EMAIL, subject: `[zha] ${subject}`, html: `<pre>${body}</pre>` }),
    generate: makeGenerate(env.ASSAY_MODEL),
    collectRepo,
    log: (message, data) => console.error('[assay]', message, data ?? ''),
  };
}
```

(`console.error` is deliberate: structured stderr logging is the v1 logger; swap for a real logger when one lands.)

- [ ] **Step 2: Implement route**

```ts
// src/app/api/assay/run/route.ts
import { timingSafeEqual } from 'node:crypto';
import { after } from 'next/server';
import { loadEnv } from '../../../../lib/assay/config';
import { defaultDeps } from '../../../../lib/assay/deps';
import { runAssayPipeline } from '../../../../lib/assay/pipeline';

export const maxDuration = 300;

function secretMatches(given: string | null, expected: string): boolean {
  if (given === null) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  const env = loadEnv();
  if (!secretMatches(request.headers.get('x-assay-secret'), env.ASSAY_RUN_SECRET)) {
    return new Response('forbidden', { status: 403 });
  }
  const body: unknown = await request.json().catch(() => null);
  const submissionId = (body as { submissionId?: unknown } | null)?.submissionId;
  if (typeof submissionId !== 'string' || submissionId === '') {
    return new Response('missing submissionId', { status: 400 });
  }
  after(() => runAssayPipeline(defaultDeps(), submissionId));
  return Response.json({ accepted: true }, { status: 202 });
}
```

The founder can re-trigger any `queued`/`failed` submission manually with the same curl as below — that IS the approval-queue mechanism for v1.

- [ ] **Step 3: Manual verify (auth surface only)**

```bash
npm run dev &
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/api/assay/run -H 'x-assay-secret: wrong' -d '{}'
# Expected: 403  (with .env.local populated; without it: 500 naming missing vars)
```

- [ ] **Step 4: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/assay/deps.ts src/app/api/assay/run/route.ts
git commit -m "feat: assay run route - secret-gated 202 with after() execution"
```

---

### Task 11: Intake — rewire submitLead + honeypot fields

**Files:**
- Create: `src/lib/assay/intake.ts`
- Modify: `src/app/actions.ts`, `src/components/hero/AssayForm.tsx`, `src/components/contact/ContactForm.tsx`, `src/app/globals.css`
- Test: `tests/unit/intake.test.ts`; modify `tests/unit/actions.test.ts`

**Interfaces:**
- Consumes: `validateLead` (`src/lib/leads.ts`), `isSpam`, `parseGitHubRepo`, `admissionDecision`, `SubmissionStore`, `LeadState` shape (unchanged — forms depend on it).
- Produces: `processLead(deps: IntakeDeps, prev: LeadState, formData: FormData): Promise<LeadState>` where `IntakeDeps = { store: SubmissionStore; notifyFounder(subject: string, body: string): Promise<void>; kickoff(submissionId: string): Promise<void>; log(message: string, data?: unknown): void }`. `submitLead` keeps its exact existing signature.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/intake.test.ts
import { describe, expect, test } from 'vitest';
import { processLead, type IntakeDeps } from '../../src/lib/assay/intake';

const idle = { status: 'idle' as const, message: '' };

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

function makeFakes(counts = { global: 0, email: 0 }) {
  const calls = { inserted: [] as { kind: string; status: string }[], founder: [] as string[], kicked: [] as string[] };
  const deps: IntakeDeps = {
    store: {
      insert: async (sub) => { calls.inserted.push({ kind: sub.kind, status: sub.status }); return 'new-id'; },
      get: async () => null, setStatus: async () => {}, saveReport: async () => {},
      countToday: async () => counts.global, countTodayByEmail: async () => counts.email,
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
```

- [ ] **Step 2: Run to verify FAIL** — `npm test -- tests/unit/intake.test.ts`

- [ ] **Step 3: Implement intake**

```ts
// src/lib/assay/intake.ts
import type { LeadState } from '../../app/actions';
import { validateLead } from '../leads';
import { admissionDecision, isSpam, parseGitHubRepo } from './domain';
import type { SubmissionStore } from './types';

export interface IntakeDeps {
  store: SubmissionStore;
  notifyFounder(subject: string, body: string): Promise<void>;
  kickoff(submissionId: string): Promise<void>;
  log(message: string, data?: unknown): void;
}

const ASSAY_SENT: LeadState = {
  status: 'sent',
  message: 'Link received. Your assay report lands in your inbox within 48 hours.',
};
const CONTACT_SENT: LeadState = {
  status: 'sent',
  message: 'Received. A human replies within one working day.',
};

export async function processLead(deps: IntakeDeps, _prev: LeadState, formData: FormData): Promise<LeadState> {
  if (isSpam(formData)) return ASSAY_SENT; // pretend success; store nothing

  const raw = {
    link: String(formData.get('link') ?? ''),
    email: String(formData.get('email') ?? ''),
    name: String(formData.get('name') ?? ''),
    message: String(formData.get('message') ?? ''),
  };
  const result = validateLead({ kind: formData.get('kind'), ...raw });
  if (!result.ok) return { status: 'error', message: result.error, values: raw };
  const lead = result.lead;

  if (lead.kind === 'contact') {
    await deps.store.insert({ kind: 'contact', email: lead.email, link: lead.link, name: lead.name, message: lead.message, status: 'manual' });
    await deps.notifyFounder('New contact lead', `${lead.name} <${lead.email}> · ${lead.link}\n\n${lead.message}`);
    return CONTACT_SENT;
  }

  const base = { kind: 'assay' as const, email: lead.email, link: lead.link, name: '', message: '' };
  if (!parseGitHubRepo(lead.link)) {
    await deps.store.insert({ ...base, status: 'manual' });
    await deps.notifyFounder('Manual assay needed (non-GitHub link)', `${lead.email} · ${lead.link}`);
    return ASSAY_SENT;
  }

  const [globalToday, emailToday] = await Promise.all([
    deps.store.countToday(),
    deps.store.countTodayByEmail(lead.email),
  ]);
  if (admissionDecision({ globalToday, emailToday }) === 'queue') {
    const id = await deps.store.insert({ ...base, status: 'queued' });
    await deps.notifyFounder('Assay queued (daily cap)', `${lead.email} · ${lead.link} · id ${id}`);
    return ASSAY_SENT;
  }

  const id = await deps.store.insert({ ...base, status: 'pending' });
  try {
    await deps.kickoff(id);
  } catch (error: unknown) {
    deps.log('kickoff failed', error);
    await deps.notifyFounder('Assay kickoff failed — run manually', `id ${id} · ${lead.email} · ${lead.link}`);
  }
  return ASSAY_SENT;
}
```

- [ ] **Step 4: Rewire the action**

Replace the body of `src/app/actions.ts` (keep `LeadState` export unchanged):

```ts
'use server';

import { baseUrl, loadEnv } from '../lib/assay/config';
import { defaultDeps } from '../lib/assay/deps';
import { processLead, type IntakeDeps } from '../lib/assay/intake';

export type LeadState = {
  status: 'idle' | 'sent' | 'error';
  message: string;
  values?: { link: string; email: string; name: string; message: string };
};

function intakeDeps(): IntakeDeps {
  const env = loadEnv();
  const deps = defaultDeps();
  return {
    store: deps.store,
    notifyFounder: deps.notifyFounder,
    log: deps.log,
    kickoff: async (submissionId) => {
      const res = await fetch(`${baseUrl()}/api/assay/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-assay-secret': env.ASSAY_RUN_SECRET },
        body: JSON.stringify({ submissionId }),
      });
      if (res.status !== 202) throw new Error(`kickoff rejected: ${res.status}`);
    },
  };
}

export async function submitLead(prev: LeadState, formData: FormData): Promise<LeadState> {
  return processLead(intakeDeps(), prev, formData);
}
```

- [ ] **Step 5: Honeypot inputs + style**

Add to `src/app/globals.css`:

```css
/* Honeypot: visually removed, still submitted by bots that fill every field. */
.hp-slot {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
```

In `src/components/hero/AssayForm.tsx`, directly after the `kind` hidden input (line 20), add:

```tsx
      <div className="hp-slot" aria-hidden="true">
        <label htmlFor="assay-company">Company</label>
        <input id="assay-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
```

In `src/components/contact/ContactForm.tsx`, directly after its `kind` hidden input (line 13), add the same block with ids `contact-company`/`htmlFor="contact-company"`.

- [ ] **Step 6: Replace `tests/unit/actions.test.ts`**

`submitLead` now requires live env + DB, so the action-level tests move to `processLead` (already written in Step 1, covering the same five behaviors: sent copy for both kinds, error state, value echo, no echo on success — value echo asserts stay via the invalid-input case). Replace the file's entire contents with:

```ts
import { describe, expect, test } from 'vitest';
// Behavior formerly tested here now lives in tests/unit/intake.test.ts against
// processLead with fake deps; submitLead is a thin env-wiring shell around it.
import { processLead, type IntakeDeps } from '../../src/lib/assay/intake';

const idle = { status: 'idle' as const, message: '' };
const noopDeps: IntakeDeps = {
  store: {
    insert: async () => 'x', get: async () => null, setStatus: async () => {},
    saveReport: async () => {}, countToday: async () => 0, countTodayByEmail: async () => 0,
  },
  notifyFounder: async () => {}, kickoff: async () => {}, log: () => {},
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
```

- [ ] **Step 7: Full test run + typecheck**

Run: `npm test && npx tsc --noEmit` — Expected: all suites PASS, clean typecheck.

- [ ] **Step 8: Commit**

```bash
git add src/lib/assay/intake.ts src/app/actions.ts src/app/globals.css \
  src/components/hero/AssayForm.tsx src/components/contact/ContactForm.tsx \
  tests/unit/intake.test.ts tests/unit/actions.test.ts
git commit -m "feat: wire submitLead to assay intake - store, honeypot, caps, kickoff"
```

---

### Task 12: Fixture integration test + launch checklist

**Files:**
- Create: `tests/fixtures/leaky-app/package.json`, `tests/fixtures/leaky-app/lib/db.ts`, `tests/fixtures/leaky-app/app/api/items/route.ts`
- Create: `tests/unit/integration.test.ts`, `scripts/assay-live.ts`

**Interfaces:**
- Consumes: `runAssayPipeline`, `selectFiles`, `scanSecrets`, real fs reads standing in for the sandbox.

- [ ] **Step 1: Fixture repo with planted flaws**

```json
// tests/fixtures/leaky-app/package.json
{ "name": "leaky-app", "private": true, "dependencies": { "next": "14.0.0", "@supabase/supabase-js": "2.39.0" } }
```

```ts
// tests/fixtures/leaky-app/lib/db.ts
// PLANTED FLAW (fixture): fake service-role-shaped JWT on the client.
import { createClient } from '@supabase/supabase-js';
export const db = createClient(
  'https://xyz.supabase.co',
  'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.fake-fixture-signature',
);
```

```ts
// tests/fixtures/leaky-app/app/api/items/route.ts
// PLANTED FLAW (fixture): no auth check, no validation, no rate limit.
import { db } from '../../../lib/db';
export async function POST(request: Request) {
  const body = await request.json();
  await db.from('items').insert(body);
  return Response.json({ ok: true });
}
```

- [ ] **Step 2: Integration test — real analysis + fake model over the fixture**

```ts
// tests/unit/integration.test.ts
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
    path, content: readFileSync(join(ROOT, path), 'utf8'),
  }));
  return {
    repoUrl: 'https://github.com/fixture/leaky-app.git', fileList, files,
    audit: { critical: 0, high: 1, moderate: 0, low: 0 }, secretHits: scanSecrets(files),
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
      get: async () => ({ id: 'i1', kind: 'assay', email: 'c@d.co', link: 'github.com/fixture/leaky-app', name: '', message: '', status: 'pending', createdAt: 'now' }),
      setStatus: async () => {}, saveReport: async () => {},
      countToday: async () => 0, countTodayByEmail: async () => 0,
    },
    sendEmail: async (m) => { sent.push({ to: m.to, html: m.html }); },
    notifyFounder: async () => {},
    generate: (async ({ prompt }: { prompt: string }) => {
      if (prompt.includes('SKEPTICAL')) return { confirmed: true, reason: 'evidence present' };
      if (prompt.includes('SECURITY REVIEW')) {
        return { findings: [{ title: 'Service-role key shipped to client', severity: 'critical', file: 'lib/db.ts', evidence: 'JWT with service_role in lib/db.ts', recommendation: 'Move to server-only env var' }] };
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
```

- [ ] **Step 3: Run to verify PASS** — `npm test` (whole suite).

- [ ] **Step 4: Live-run script (manual, real APIs — costs money, needs env)**

```ts
// scripts/assay-live.ts — manual smoke: npx tsx scripts/assay-live.ts <github-url> <email>
import 'dotenv/config';
import { defaultDeps } from '../src/lib/assay/deps';
import { runAssayPipeline } from '../src/lib/assay/pipeline';

const [link, email] = process.argv.slice(2);
if (!link || !email) throw new Error('usage: npx tsx scripts/assay-live.ts <github-url> <email>');
const deps = defaultDeps();
const id = await deps.store.insert({ kind: 'assay', email, link, name: '', message: '', status: 'pending' });
await runAssayPipeline(deps, id);
console.error('[assay] live run complete for', id);
```

Run once against a small known public repo with your own email; read the report that arrives — this is the first real assay and the founder's tuning loop for the rubrics.

- [ ] **Step 5: Launch checklist (manual, in Vercel dashboard / CLI)**

```bash
# secrets (generate: openssl rand -hex 24)
vercel env add ASSAY_RUN_SECRET
vercel env add RESEND_API_KEY      # after verifying thezhafoundry domain in Resend
vercel env add RESEND_FROM         # e.g. "The Zha Foundry <assay@thezhafoundry.com>"
vercel env add FOUNDER_EMAIL
# DATABASE_URL comes from the Neon marketplace integration (Task 3)
# AI Gateway auth is automatic on Vercel (OIDC); local dev: vercel env add AI_GATEWAY_API_KEY
```

Deploy to preview, submit the live form once end-to-end, confirm: report email arrives, founder notification arrives, row in Neon reads `sent`.

- [ ] **Step 6: Commit**

```bash
git add tests/fixtures/leaky-app tests/unit/integration.test.ts scripts/assay-live.ts
git commit -m "test: assay fixture integration run + live smoke script"
```

---

## Self-review notes

- Spec coverage: intake/honeypot (T2, T11), sandbox isolation (T5), 4 parallel reviewers with failure isolation (T6), verifier fail-closed (T7), email-only report + snag email (T8), founder notification on every outcome (T9), cost caps + manual queue via re-trigger curl (T2, T10, T11), submission store (T3), fixture integration test per spec's testing section (T12). Spec's "open questions" resolved here: trigger = secret-gated route + `after()`; rate limit = daily caps + queued status; PDF library = none (HTML email).
- Type consistency: `AssayDeps`/`SubmissionStore`/`Finding` defined once in Task 2 and consumed by name everywhere; `LeadState` shape unchanged for forms.
- Known accepted risks: `@vercel/sandbox` `runCommand` result surface is verified only for `stdout()`/`stderr()` (guard uses `test -d` echo rather than exit codes); AI Gateway model id `anthropic/claude-sonnet-4.5` is the documented-stable choice, upgradeable via `ASSAY_MODEL` env without code change.
