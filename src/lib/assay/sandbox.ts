import { Sandbox } from '@vercel/sandbox';
import { MAX_TOTAL_CHARS, parseAuditJson, scanSecrets, selectFiles } from './analysis';
import type { RepoContext, RepoFile } from './types';

const PER_FILE_CHAR_CAP = 20_000;

function shellQuote(path: string): string {
  return `'${path.replaceAll("'", `'\\''`)}'`;
}

/**
 * Everything that touches untrusted repo content — clone, file reads, npm audit
 * parsing its lockfile — happens inside the microVM; only captured strings leave.
 * Auth is automatic via OIDC on Vercel; local runs need VERCEL_TOKEN/TEAM_ID/PROJECT_ID.
 */
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
      repoUrl,
      fileList,
      files,
      audit: parseAuditJson(await audit.stdout()),
      secretHits: scanSecrets(files),
    };
  } finally {
    await sandbox.stop();
  }
}
