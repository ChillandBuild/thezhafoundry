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
