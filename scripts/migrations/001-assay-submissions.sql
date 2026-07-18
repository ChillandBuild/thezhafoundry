create table if not exists assay_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('assay', 'contact')),
  email text not null,
  link text not null default '',
  name text not null default '',
  message text not null default '',
  status text not null,
  detail text not null default '',
  report_html text,
  findings jsonb,
  created_at timestamptz not null default now()
);
create index if not exists assay_submissions_created_at_idx on assay_submissions (created_at);
