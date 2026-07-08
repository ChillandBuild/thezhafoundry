# The Zha Foundry — Monumental Site Plan

Date: 2026-07-08 · Status: **awaiting approval**
Companion spec: [superpowers/specs/2026-07-08-monumental-site-design.md](superpowers/specs/2026-07-08-monumental-site-design.md)

## What this is

An **enhancement pass**, not a rebuild. Every line of copy, the funnel structure
(Assay → Cast/Forge → Care → Standard), the Stepped Z mark, copper-on-carbon +
foundry-daylight themes, and Archivo / IBM Plex Mono stay exactly as they are.
All 25 concepts below layer onto the existing build.

## The signature idea

**The page IS a pour.** Molten at the top (1,084.6 °C — copper's melting point),
the metal travels down the seam as you scroll, transforms section by section,
and arrives at the footer cooled to ambient (24.0 °C) — cast, solid, signed.

- A live temperature gauge in the nav cools from 1,084.6 °C → 24.0 °C with scroll.
- Every section treatment is one stage of that cooling: liquid (hero) → shaped
  (doors, tiers) → verified (standard) → cooled and signed (footer).

## The 25 concepts

### Global atmosphere — connective tissue (1–5)

| # | Concept | What it does |
|---|---------|--------------|
| 1 | Temperature narrative | Nav gauge scrubs 1,084.6 → 24.0 °C with scroll; hero and footer readouts bookend it |
| 2 | Pour seam v2 | Molten SVG-displacement wobble on the seam; drips shed from the traveling tip |
| 3 | Seam runners | Feed lines branch from the seam into each section label and ignite on arrival |
| 4 | Foundry-dust atmosphere | Theme-aware grain + vignette — sunlit dust in daylight, forge haze at night |
| 5 | Stepped rules | Section dividers step down mid-span like the Z mark, staggered like coursed ingots |

### Hero — the thesis: molten (6–10)

| # | Concept | What it does |
|---|---------|--------------|
| 6 | Molten-metal field | Hand-written WebGL shader (~4 kb GLSL, no three.js): domain-warped noise on the brand heat ramp behind the mark; theme-aware; paused when offscreen |
| 7 | Extruded Stepped Z | CSS-3D layer stack turns the flat mark into a billet with real depth that tilts toward the pointer |
| 8 | Cast-and-cool headline | Each glyph pours in molten-hot and cools to its final color, left to right |
| 9 | Instrument decode | Mono readouts scramble-decode from glyph noise, like gauges coming online |
| 10 | Ember system v2 | Three depth layers, gentle pointer repulsion, spark burst on click |

### Section treatments — each fundamentally unique (11–25)

| # | Section | Concept |
|---|---------|---------|
| 11 | Assay | Intake slot: focus ignites a traveling heat line; a mono "assay ticket" stamps beneath as you type |
| 12 | Two Doors | Literal 3D doors that swing open in perspective as they scroll in |
| 13 | Two Doors | Conveyor pipelines: a spark travels the stage lines, pulsing at each human gate ⌖ |
| 14 | Reality Check | Transformation chamber: corroded left cells vs. machined right; hover sweeps a re-forge gradient across the row |
| 15 | Reality Check | Molten column divider between in/out, scrubbed by scroll |
| 16 | Tiers | Beveled ingot slabs with per-tier heat gauges (warm / hot / molten); featured tier breathes an inner glow |
| 17 | Care | Live watch console: breathing status dots, ticking mono uptime counter, heartbeat trace behind |
| 18 | Process | The stage line becomes a molten channel that fills with scroll; nodes ignite with ember pops |
| 19 | Process | Ghost stencil numerals 01–05 behind stages (numbering is real: it is a production sequence) |
| 20 | Manifesto | Stencil ✕ stamps slam onto each refusal, like rejection stamps on crates |
| 21 | Standard | Checklist ticks itself (□ → ■ ignition flashes) on an engraved certificate plate |
| 22 | Standard | Living hex seal: one slow revolution per minute, flares on hover |
| 23 | Teardowns | Simmering crucible pools; heat-shimmer distortion on "In the crucible" |
| 24 | Contact | The final pour: seam terminates into a receiving mold; submit fills molten on hover; success stamps like cooled metal |
| 25 | Footer | Cooling bookend: giant ghosted stencil wordmark, dying embers, "24.0 °C — ambient" |

## Type decision

Third wordmark face: **Saira Stencil One** (already in the build — kept, per the
"choose it yourself" directive). Reasoning: stencil lettering is how foundries mark
castings and crates; its square-shouldered geometry and cut bridges echo the
stepped Z's broken path. Used only for the wordmark and ghost display stamps —
never body text. Archivo and IBM Plex Mono remain locked for everything else.

## Guardrails

- **No new npm dependencies.** GSAP (already installed) + hand-rolled Canvas/WebGL/SVG.
- JS budget < 150 kb gzipped (landing-page budget).
- Every effect gated behind `prefers-reduced-motion`, each with a designed static
  fallback (heat lines render lit, checkboxes render checked, doors render open).
- Effects are transform/opacity-only — zero layout shift. All rAF loops pause offscreen
  and when the tab is hidden.
- No prices, no fake proof, no ழ derivation anywhere public. Copy verbatim.

## Process after approval

1. Finish the build (foundation + hero are already coded; sections 11–25 remain).
2. Verify: `npm run build`, unit + Playwright tests green.
3. Screenshots at 320 / 768 / 1024 / 1440, **both themes**.
4. **Three fine-tooth-comb iteration passes** — each produces a written problem
   list (design flaws, opportunities to complexify, inconsistencies) and fixes.
5. Final a11y + performance check.
6. Vercel **preview** deploy. Production promotion only after your explicit OK.
7. Deliver nano-banana image prompts (foundry-floor divider, crucible close-up,
   OG/social card) — layout works with or without the images.

## Current state

Spec written; foundation (concepts 1–5) and hero concepts 6–8 coded; nothing
committed yet. Build resumes on your approval.
