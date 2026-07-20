import { z } from 'zod';
import type { AssayDeps, Finding, RepoContext } from './types';

const verdictSchema = z.object({ confirmed: z.boolean(), reason: z.string().max(500) });

function buildVerifyPrompt(finding: Finding, ctx: RepoContext): string {
  const file = ctx.files.find((f) => f.path === finding.file);
  return [
    `You are an independent verifier. Your default position is SKEPTICAL: confirm this finding only if the evidence in the provided code genuinely supports it. If you cannot verify it from what is shown, refute it.`,
    `Finding under review (${finding.dimension}/${finding.severity}): ${finding.title}`,
    `Claimed evidence: ${finding.evidence}`,
    file
      ? `Cited file ${file.path}:\n${file.content}`
      : `No cited file. Repo file list:\n${ctx.fileList.join('\n')}`,
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
