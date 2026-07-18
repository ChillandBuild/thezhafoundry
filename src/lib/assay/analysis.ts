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
      critical: Number(v.critical ?? 0),
      high: Number(v.high ?? 0),
      moderate: Number(v.moderate ?? 0),
      low: Number(v.low ?? 0),
    };
  } catch {
    return zero;
  }
}

const SECRET_PATTERNS: ReadonlyArray<{ kind: string; re: RegExp }> = [
  { kind: 'supabase-service-role-jwt', re: /eyJ[\w-]+\.[\w-]*c2VydmljZV9yb2xl[\w-]*\.[\w-]+/ },
  { kind: 'openai-key', re: /sk-[a-zA-Z0-9-]{20,}/ },
  { kind: 'anthropic-key', re: /sk-ant-[a-zA-Z0-9-]{20,}/ },
  { kind: 'aws-access-key', re: /AKIA[0-9A-Z]{16}/ },
  { kind: 'private-key-block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { kind: 'stripe-secret', re: /sk_live_[a-zA-Z0-9]{16,}/ },
];

// A tripwire, not a full scanner: one hit per pattern per file, first matching line.
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
