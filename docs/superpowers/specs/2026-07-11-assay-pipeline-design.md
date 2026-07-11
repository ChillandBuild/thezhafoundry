# Assay Pipeline — Design

## Purpose

Turn a submitted Assay form (public GitHub repo URL + contact info) into a
verified, emailed audit report, without a human doing the first read. This
replaces the current placeholder behavior (`submitLead` logs to console only)
and closes the launch-blocking gap: real lead delivery.

Positioning constraint carried over from `PRODUCT.md`: The Zha Foundry is
"the independent party that verifies AI-built software." A report containing
an unconfirmed or wrong finding directly damages that claim — this shapes
several decisions below (the verifier pass, dropping rather than softening
unconfirmed findings).

## Non-goals

- Private repo support (OAuth/GitHub App install) — v1 is public URL only.
- A hosted, on-site report page — v1 delivers PDF via email only.
- Automating Forge or Cast — this pipeline serves Assay only, though its
  AUDIT-stage output is reused as the first input to a Forge engagement.

## Architecture

```
Assay form (public GitHub URL + contact info)
   -> API route: validate input + honeypot check
   -> submission record created (status: pending)
   -> async trigger -> Vercel Sandbox
        clone repo, run static analysis
        (dependency/CVE scan, linter, secret scanner)
   -> 4 parallel AI review agents, each reading
      (code + static analysis output) against a fixed rubric:
        - security & secrets
        - correctness & error handling
        - architecture & scalability
        - code quality & maintainability
   -> verifier pass: each finding independently re-checked;
      unconfirmed findings dropped, not softened
   -> report assembled from verified findings (fixed 4-section structure)
   -> PDF/email generated, sent via Resend
   -> submission record updated (status: sent | failed)
   -> Slack/email notification to founder on every outcome
```

## Components

- **Assay form + API route** — validates GitHub URL format, honeypot check,
  writes submission record, triggers pipeline, returns immediate
  confirmation. Never blocks on pipeline completion.
- **Sandbox runner** — Vercel Sandbox instance. Clones the repo, installs
  dependencies, runs static analysis tools, captures output, tears down.
  Chosen over a self-managed backend service specifically because installing
  dependencies from an untrusted repo can execute arbitrary code
  (postinstall scripts); Sandbox's isolation is the point, not a convenience.
- **Review agents (4, parallel)** — call Claude via AI SDK/AI Gateway with
  repo contents + static analysis output + a dimension-specific rubric.
  Return schema-validated structured findings, not free text. Run
  concurrently, not sequentially, to stay inside the Vercel Function timeout.
- **Verifier pass** — each finding gets an independent re-check call before
  inclusion. A finding that can't be confirmed is dropped.
- **Report assembler** — merges verified findings into the fixed 4-dimension
  structure, renders as PDF (or rich HTML email body).
- **Delivery** — Resend sends the report to the client. A separate
  Slack/email notification to the founder fires on every run's outcome
  (success or failure with error detail) — a broken pipeline must never
  fail silently on a real submission.
- **Submission store** — minimal record per Assay: contact info, repo URL,
  status, timestamps, report content/findings. Needed for founder visibility
  into volume/conversion and as the reference point for any later Forge
  conversation.

## Data flow

1. Form submit -> submission record created (`pending`).
2. Async trigger kicks off the Sandbox job.
3. Static analysis artifacts captured and stored alongside the submission.
4. 4 review agents run concurrently against (code + static analysis output).
5. Verifier pass re-checks each finding independently.
6. Verified findings assembled into the report; PDF/email generated.
7. Resend delivers to the client; submission record updated (`sent`).
8. Slack/email notification to the founder, regardless of outcome.

## Error handling

- Invalid/inaccessible repo URL: rejected at submit time with a clear
  message; never enters the pipeline.
- Sandbox failure (clone fails, install fails, timeout): submission marked
  `failed`, founder notified with the error; client receives a plain
  "we hit a snag, we'll follow up personally" email rather than silence.
- One review agent fails: the other 3 dimensions still complete; the report
  ships with the working sections plus a note that one dimension needs
  manual follow-up, rather than failing the whole run.
- Verifier drops a finding: logged internally (signal for tuning the rubric
  later), never shown to the client.

## Cost control

Each run costs real Claude API spend (4 parallel review calls + one
verification call per finding). Given the no-capital constraint, v1 needs a
simple cap at submit time — a rate limit and/or manual approval queue while
volume is low — so a bot flood or an oversized repo can't burn budget
unattended.

## Testing

- Unit tests: API route input validation, honeypot logic.
- Integration test: full pipeline run against a small fixture repo (checked
  into the test suite, not a live GitHub fetch) with known findings, to
  catch regressions in the agent/verifier prompts.
- No E2E browser test needed for v1 — the form itself follows existing site
  conventions and is already covered there; the pipeline's complexity is
  server-side, not UI.

## Open questions for the implementation plan

- Exact async trigger mechanism (Vercel Queues vs. a simpler fire-and-forget
  Function call) — left to the plan phase.
- Rate limit / approval queue implementation detail.
- PDF rendering library choice.
