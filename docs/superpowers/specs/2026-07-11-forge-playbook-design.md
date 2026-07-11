# Forge Playbook — Design

## Purpose

Define how Door 02 ("Bring a prototype. We make it production.") actually
gets delivered for the first several engagements, without building new
product software first. Forge work is bespoke per client — unlike Assay,
there's no fixed report to automate output for — so v1 is a documented
playbook the founder runs by hand, using the existing Claude Code setup
(the specialized review agents already configured: `security-reviewer`,
`database-reviewer`, `typescript-reviewer`, `tdd-guide`, etc.) as the actual
delivery mechanism.

Automating any part of this (an automated propose/review harden pipeline)
is deferred until real engagements show which fixes repeat often enough to
be worth codifying — building that now would encode guesses, not evidence.

## Scope

Covers the site's stated Forge pipeline: **INTAKE -> AUDIT -> HARDEN ->
VERIFY -> SHIP**, specialty stack per `TwoDoors.tsx`: Next.js + Supabase
apps from Lovable, Bolt, v0, and Cursor.

## Stage breakdown

**INTAKE** — Paid engagement, so access is broader than the free Assay's
public-URL-only constraint: client grants repo collaborator access (or
transfers/forks the repo). Scope and fixed price agreed before work starts,
per the "no prices on the site, fixed quote after assay" positioning.

**AUDIT** — Reuses the Assay pipeline's output as the starting brief (see
`2026-07-11-assay-pipeline-design.md`) rather than re-auditing from scratch.
If the client arrives via Forge directly (not through a prior Assay), an
Assay run is triggered first to produce the same baseline.

**HARDEN** — The core paid work. Founder drives Claude Code directly
against the client repo, using the checklist below as the working list, not
as a rote script — real repos will have engagement-specific problems beyond
it.

**VERIFY** — Human gate: founder reviews every diff before it ships. No
agent output merges unreviewed, matching the site's own claim ("every stage
ends at a human gate").

**SHIP** — Production environment running, handover docs written, option to
convert into a Care subscription (future ladder rung, not designed here).

## Known failure-pattern checklist (v1, to refine with real engagements)

**Security**
- Supabase service role key present in client-side code (most common single
  failure in this tool category — demos often reach for the service role
  key because it bypasses RLS friction).
- Row Level Security missing entirely, or enabled with an overly permissive
  policy (e.g. `USING (true)`).
- API routes with no auth check, reachable directly regardless of UI gating.
- Secrets committed to the repo or hardcoded instead of environment
  variables.

**Correctness**
- Client-side-only validation; API routes trust whatever hits them.
- No error boundaries — one failing component takes down the page.
- Optimistic UI updates with no rollback path on failure.

**Scalability / production-readiness**
- No rate limiting on API routes.
- N+1 query patterns from client-side calls inside loops instead of joins.
- Missing indexes on frequently-queried columns.

**Ops**
- No error monitoring/logging.
- Zero test coverage.
- Dev/prod parity gaps (env vars or build config differing between local
  and deployed).

## Non-goals (v1)

- No automated scan-and-propose tooling.
- No new deployment/build infrastructure beyond what a given client project
  already uses, unless containerization/zero-downtime deploys are explicitly
  in scope for that engagement (per the site's stated Forge description).

## Success criteria

A Forge engagement is complete when: the checklist items relevant to that
repo are resolved and verified by the founder, a production environment is
running, handover docs exist, and the client has a clear answer to "is this
now safe to take money/users on."

## Open questions

- After 3-5 real engagements: which checklist items recurred every time?
  Those are the automation candidates for a future Forge v2 design.
- Whether Care subscription hooks (ongoing monitoring) should be scaffolded
  during SHIP even before Care itself is designed — deferred.
