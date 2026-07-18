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
