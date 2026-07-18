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
