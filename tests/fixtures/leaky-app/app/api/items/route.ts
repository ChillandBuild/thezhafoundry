// PLANTED FLAW (fixture): no auth check, no validation, no rate limit.
// @ts-nocheck — fixture file, not part of the site build.
import { db } from '../../../lib/db';
export async function POST(request: Request) {
  const body = await request.json();
  await db.from('items').insert(body);
  return Response.json({ ok: true });
}
