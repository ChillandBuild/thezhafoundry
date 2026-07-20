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
