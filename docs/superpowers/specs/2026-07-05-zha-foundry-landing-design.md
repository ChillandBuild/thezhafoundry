# The Zha Foundry — Landing Site Design Spec

**Date:** 2026-07-05 · **Status:** Awaiting founder approval · **Scope:** Landing website v1

## 1. Positioning (decided)

The Zha Foundry is **the independent party that verifies, warranties, and keeps AI-built
software alive** — not "we fix AI's bad code" (that claim erodes with every model release;
independence does not). The creator of code cannot be its auditor; we are the third party.

- **Market:** global vibe-coders (Lovable / Bolt / v0 / Cursor / Replit founders), not India-first.
  India is the cost advantage, not the market.
- **Founder reality v1:** solo, student, no capital. The site is founder-honest — no fake-big
  agency claims, no "elite engineering leads," no enterprise warranty language yet.
- **Initial technical niche:** Next.js + Supabase apps (what the major vibe-coding tools generate).
- **The ladder (strategy, also the brand):** Assay → Forge → Care → Standard → Certification.
  v1 sells the first three rungs and publishes a teaser of the fourth.

## 2. Offers (the site's funnel)

One funnel: **Assay (free) → Forge (one-time $) → Care (recurring $)**.

1. **The Assay** — free audit of a repo/app link. Scored report: security, secrets, scaling
   risks, test coverage, token-cost waste. v1 is semi-automated behind the scenes; the
   interface is the promise. Lead capture = the hero input.
2. **The Forge** — three fixed-price rescue tiers (no custom quotes):
   - **Audit** (~$299): full assay + prioritized fix plan.
   - **Harden** (~$899): audit + security/auth fixes, secrets hygiene, test suite to agreed coverage.
   - **Full Forge** (~$1,900): harden + refactor, containerization, CI/CD, deployment, handover docs.
   - Prices are launch placeholders; founder can adjust before publish.
3. **Foundry Care** — $99–199/mo: dependency updates, CVE patching, uptime monitoring,
   token-cost drift alerts, monthly health report.

**Explicitly not offered on the site:** from-scratch builds (by referral only), courses,
community, certification claims. The Zha Standard appears as **v0.1, a published checklist**,
not a certification service.

## 3. Brand identity (decided — see artifact "Zha Foundry — Logo Concepts")

- **Logo: the Stepped Z** — a Z whose diagonal is a staircase. Public read: sharp industrial Z.
  Private read: the proto-Tamil ழ ladder (Kodumanal/Edakkal pot-shard maker's marks), concealed
  FedEx-arrow style. The story stays with the founder; the site does not explain it.
  - Geometry: polyline `14,14 50,14 50,23 38,23 38,32 26,32 26,41 14,41 14,50 50,50` in a
    64×64 viewBox; square caps, miter joins; stroke 5–6.
- **Roles:** Stepped Z = logo (nav, favicon, footer) · Z + heat gradient = animated hero mark ·
  Z inside hexagonal cartouche = assay/report seal · seven-rung ladder glyph = secondary
  pattern (process rails, textures). No derivation story in public copy.

## 4. Design language

- **Palette (dark, committed):** ground `#141110` warm carbon · surface `#1C1815` ·
  line `#2E2822` · text `#F0EBE3` · muted `#9B9288` · copper `#E07830` · hot `#FFB25E` ·
  deep `#B34A16` · cooled steel `#8A8078`. Copper is used as *heat* (gradients, glow), not
  as a flat decorative accent.
- **Type:** Archivo (800 display, 500 body) + IBM Plex Mono (spec labels, data, table).
  Self-hosted via `next/font`. Max two families.
- **Aura principles (from pi.dev dissection):** opinionated copy; one signature system executed
  deeply; restraint everywhere else; dense specificity (real prices, real checklist items, real
  audit categories); zero filler ("trusted by innovative teams" is banned).
- **Signature system — heat:** the page has a temperature. A thin vertical **pour-seam** line
  runs the page and glows with scroll progress; the hero Z loads molten and cools to solid;
  mono furnace-readout labels (`POUR TEMP 1,084.6 °C — Cu`) stamp the sections; process stages
  ignite as you pass them. Nothing else moves.
- **Motion budget:** one hero load sequence, scroll-driven seam, stage ignition, magnetic hover
  on the two primary CTAs. GSAP + ScrollTrigger, dynamically imported. Compositor-friendly
  properties only. Everything off under `prefers-reduced-motion`.

## 5. Page structure & copy direction

1. **Nav** — Stepped Z lockup (`THE ZHA FOUNDRY`, copper ZHA) · links: Assay / Forge / Care /
   Standard / Teardowns · CTA button.
2. **Hero** — H1: **"You vibe code it. We forge it."** Sub (repositioned): the independent
   foundry that takes AI-built prototypes to production — audited, hardened, kept alive.
   **Primary element: the Assay input** — paste a GitHub/Replit/Lovable link → free audit
   report. Secondary CTA: "See the tiers." Molten Z + cooling load sequence.
3. **Reality Check table** — spec-sheet styling; input column in cooled steel, output in copper.
   Copy per original brief, one change: "100% automated test coverage" →
   **"Engineered test coverage, verified before handover."**
4. **The Forge (tiers)** — three fixed-price cards, concrete deliverables listed per tier,
   mono pricing. No "contact for quote."
5. **Foundry Care** — the subscription strip: what the agents watch monthly, price, one CTA.
6. **Process** — five stages on the pour-seam (Intake & Audit → Blueprint → Assembly →
   Human Review → Shipment), each igniting on scroll. Rails use the ladder glyph.
7. **"What we don't do"** — the pi.dev-style opinion section: we don't build from scratch;
   we don't bill hours; we don't certify our own code — we're the independent party that
   verifies AI's.
8. **The Zha Standard v0.1** — teaser: published checklist of what production-ready means,
   grouped (security, tests, infra, cost, provenance), with the hexagon seal. Real items, not
   marketing bullets.
9. **Teardown gallery** — 2–3 slots; ships with honest placeholders styled as "Teardown Nº 001 —
   in progress" (no fake case studies).
10. **Final CTA + form** — "Stop wrestling with prompt limits. Let's turn your vibe into
    structural steel." Fields: Name, Email, Project link, Message.
11. **Footer** — wordmark, founder-honest line (who's building this, build-in-public links),
    contact. No ladder-story exposition.

## 6. Technical plan

- **Stack:** Next.js (App Router, TypeScript, already scaffolded), vanilla CSS with token files
  (`tokens.css`, `typography.css`, `global.css`), components organized by feature per user rules.
- **Form handling:** server action; v1 stub validates (zod), logs, returns success state; clear
  TODO to wire Resend/Slack. Assay input feeds the same capture path with `type: assay`.
- **Performance:** landing budget < 150 kb gzipped JS (GSAP dynamically imported ~30 kb counts);
  fonts subset + preloaded critical weights; LCP < 2.5 s; CLS < 0.1; explicit image dimensions.
- **Accessibility:** semantic landmarks, visible focus states, reduced-motion variants, WCAG AA
  contrast (copper on carbon passes for large text/labels; body text uses `#F0EBE3`/`#9B9288`).
- **Verification before done:** production build passes; screenshots at 320/768/1024/1440;
  keyboard walk-through; reduced-motion pass.

## 7. Out of scope for v1

Real automated Assay pipeline · payments · dashboard · blog engine (teardowns are static pages
first) · certification infrastructure · light theme (dark is the committed brand world).

## 8. Success criteria

A visitor who lands cold can answer in 10 seconds: *what is this, is it for me, what do I do
next* (paste link). The page reads as designed-by-a-person (opinionated copy, one deep
signature system, zero template patterns), passes the performance/a11y gates above, and every
claim on it is true today.
