import { z } from 'zod';

const email = z
  .string()
  .trim()
  .max(200, 'That email is too long.')
  .email('Enter a valid email so the report can reach you.');

export const leadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('assay'),
    link: z
      .string()
      .trim()
      .min(4, 'Paste a project link — GitHub, Replit, Lovable, or a live URL.')
      .max(300, 'That link is too long.'),
    email,
  }),
  z.object({
    kind: z.literal('contact'),
    name: z.string().trim().min(1, 'Add your name.').max(120, 'That name is too long.'),
    email,
    link: z.string().trim().max(300, 'That link is too long.').optional().default(''),
    message: z
      .string()
      .trim()
      .min(1, 'Say a line about the project or idea — the message is empty.')
      .max(4000, 'Keep the message under 4,000 characters.'),
  }),
]);

export type Lead = z.infer<typeof leadSchema>;

const FRIENDLY_FALLBACK: Record<string, string> = {
  kind: 'Something went wrong with the form. Refresh the page and try again.',
  email: 'Enter a valid email so the report can reach you.',
  link: 'Paste a project link — GitHub, Replit, Lovable, or a live URL.',
  name: 'Add your name.',
  message: 'Say a line about the project or idea — the message is empty.',
};

export function validateLead(
  input: unknown,
): { ok: true; lead: Lead } | { ok: false; error: string } {
  const parsed = leadSchema.safeParse(input);
  if (parsed.success) return { ok: true, lead: parsed.data };
  const issue = parsed.error.issues[0];
  const field = String(issue?.path?.[0] ?? '');
  const message = issue?.message ?? '';
  const isAuthored = message !== '' && !/invalid|expected|received/i.test(message);
  return {
    ok: false,
    error: isAuthored ? message : (FRIENDLY_FALLBACK[field] ?? 'Check the form and try again.'),
  };
}
