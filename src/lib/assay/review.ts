import { z } from 'zod';
import type { AssayDeps, Dimension, Finding, RepoContext, ReviewResult } from './types';

export const DIMENSIONS = ['security', 'correctness', 'architecture', 'quality'] as const;

export const findingsSchema = z.object({
  findings: z
    .array(
      z.object({
        title: z.string().max(120),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        file: z.string().optional(),
        evidence: z.string().max(1000),
        recommendation: z.string().max(600),
      }),
    )
    .max(8),
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
