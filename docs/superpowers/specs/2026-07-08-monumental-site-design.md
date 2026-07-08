# The Zha Foundry — Monumental Site Enhancement

Date: 2026-07-08 · Status: approved (autonomous run per /goal directive)

## Premise

Enhancement pass on the existing landing page. Nothing is rebuilt; every existing
component, class, and line of copy stays. 25 distinct design concepts layer onto the
existing heat/pour system so each section reads fundamentally unique while the whole
page stays one brand.

**Signature (the one thing the page is remembered by):** the page IS a pour.
Molten at the top (1084.6 °C, copper melting point), the metal travels down the seam
as you scroll, transforms section by section, and arrives at the footer cooled to
ambient (24.0 °C) — cast, solid, signed. Every concept below serves that narrative.

## Locked ground truth (from /goal)

- Stepped Z mark, "THE ZHA FOUNDRY", copper-on-carbon dark + foundry-daylight light, working toggle.
- Archivo + IBM Plex Mono. Third face: **Saira Stencil One** (already in build) — kept.
  Reasoning: stencil lettering is how foundries mark castings and crates; Saira's
  geometry is square-shouldered like the stepped Z, and its cut bridges echo the mark's
  broken path. Used only for the wordmark and ghost display stamps — never body text.
- All copy verbatim. No prices, no fake proof, no ழ mention.
- CSS/SVG/Canvas/GSAP/raw WebGL only. No new npm deps. Deploy: Vercel (preview only without asking).

## The 25 concepts

### Global atmosphere (the connective tissue)

1. **Whole-page temperature narrative** — a mono `°C` gauge in the nav scrubs from
   1084.6 °C → 24.0 °C with scroll progress (eased so it lingers hot). The hero
   readout and footer "ambient" readout bookend it.
2. **Pour seam v2** — the fixed seam gains an SVG-filtered molten wobble, and the
   traveling tip sheds drip particles (tiny canvas strip) as it rides the pour front.
3. **Seam runners** — short horizontal feed lines branch from the seam toward each
   section heading and ignite (fill hot → cool to line color) when the section arrives.
4. **Foundry-dust atmosphere** — full-page SVG turbulence grain + soft vignette,
   opacity tuned per theme so daylight reads as sunlit dust, night as forge haze.
5. **Ingot-cut section edges** — section boundaries become shallow angled cuts
   (clip-path bevels) instead of flat 1 px rules; alternating direction like stacked ingots.

### Hero (the thesis: molten)

6. **Raw-GLSL molten-metal field** — a WebGL fragment shader behind the hero mark:
   flowing fbm noise mapped to the copper heat ramp, theme-aware (bright liquid metal
   in dark, warm mirage in light). ~4 kb of hand-written GLSL, no three.js.
   Fallback: existing static gradient. Paused offscreen and on `document.hidden`.
7. **Extruded Stepped Z** — the flat mark becomes a CSS-3D stack (layered copies with
   translateZ) that tilts subtly toward the pointer; the heat-gradient face stays the
   top layer so the existing forge-breathe cycle now reads as depth-lit.
8. **Cast-and-cool headline** — per-character entrance: each glyph pours in at
   `--hot`, then cools through copper to `--text` (background-clip ramp), left to right.
9. **Instrument decode** — hero readout + eyebrows scramble-decode from mono glyph
   noise (`▓░01`) into text on entrance, like foundry instrumentation coming online.
10. **Ember system v2** — three depth layers (far small/slow, near large/soft-blurred),
    embers repel gently from the pointer, and a click on the mark strikes a spark burst.

### Section treatments (each fundamentally unique)

11. **Assay intake slot** — the URL field becomes a machined intake: focus ignites a
    traveling heat line around the field; a mono "assay ticket" row stamps beneath as
    you type (`SPECIMEN RECEIVED · <host>`), all client-side.
12. **Two literal doors** — each door card sits in perspective and swings open
    (rotateY from a hinged edge) as it scrolls in; interior face carries the pipeline.
13. **Conveyor pipelines** — a spark travels the Cast/Forge stage lines on hover,
    pausing to pulse at each human gate ⌖.
14. **Transformation chamber** (Reality Check) — left cells corroded (steel, rough
    baseline, faint scanline jitter), right cells machined (clean, copper edge light);
    row hover sweeps a re-forge gradient left → right across the row.
15. **Molten column divider** — the border between in/out columns becomes a
    scroll-scrubbed heat gradient that brightens as the table enters the viewport.
16. **Tier ingots** — tiers become beveled slabs (layered metal-edge gradients) with a
    per-tier heat gauge (1/2/3 bars: Audit warm, Harden hot, Full Forge molten);
    featured tier breathes an inner glow; hover lifts the slab with a molten underlight.
17. **Care watch console** — the care list becomes an instrument panel: each item gets
    a breathing status dot and a live mono uptime counter; a slow SVG heartbeat trace
    runs behind — "the foundry doesn't leave."
18. **Molten runner** (Process) — the stage line becomes a channel that fills with heat
    gradient scrubbed to scroll; each node ignites with a CSS ember pop when passed.
19. **Ghost stage numerals** — huge Saira Stencil `01–05` ghosts behind each stage
    (numbering is real here: it is a production sequence).
20. **Stamp-slam refusals** (Manifesto) — each "We don't" card's ✕ becomes a stencil
    stamp that slams in on reveal (scale 2.6→1, slight rotation, one-frame dust ring).
21. **Self-checking Standard** — checklist boxes tick themselves (□ → ■ with an
    ignition flash) staggered as the section scrolls in; the section sits on an
    engraved certificate plate (double-rule border, corner marks).
22. **Living seal** — the hex seal rotates one slow revolution per minute, pauses and
    flares on hover; it is the "signature" object of the Standard.
23. **Crucible cards** (Teardowns) — each placeholder holds a simmering molten pool
    (CSS animated gradient blob behind a rough mask) and "In the crucible" shimmers
    with an SVG heat-distortion filter.
24. **The final pour** (Contact) — the seam visually terminates here: a receiving mold
    graphic above the form; the submit button fills with molten gradient on hover
    ("pour"); on success the status stamps in like cooled metal.
25. **Cooling bookend** (Footer) — always-carbon footer gains a giant ghosted stencil
    wordmark, a few dying embers, and the ambient readout `24.0 °C — cast, signed`.

## Architecture

- `src/lib/motion/` — split GSAP work: `loadGsap.ts` (singleton dynamic import),
  `entrance.ts`, `seam.ts`, `temperature.ts`, `sections.ts`, `magnetic.ts`.
  `ForgeMotion.tsx` stays the single mount point and composes them.
- `src/components/hero/MoltenField.tsx` — WebGL canvas (raw GLSL, DPR-capped,
  IntersectionObserver + visibility pausing, context-loss safe).
- `src/components/hero/ExtrudedZ.tsx` — CSS-3D layer stack around existing marks.
- New CSS stays co-located per component; shared tokens extended in `tokens.css`
  (heat ramp stops, bevel angle, grain opacity per theme).
- Everything motion-gated behind `prefers-reduced-motion`; every effect has a static
  fallback that still reads as designed (heat lines render lit, checkboxes render
  checked, doors render open).

## Quality gates

- `npm run build`, unit tests, Playwright e2e stay green.
- Screenshots: 320/768/1024/1440, both themes, key sections.
- Three fine-tooth-comb iteration passes after "complete", each producing a written
  problem list and fixes.
- CWV budget: landing JS < 150 kb gz (no new deps; shader + particles are hand-rolled).
- Axe-clean; keyboard nav; visible focus; no layout shift from effects (all effects
  are absolutely positioned or transform-only).

## Nano-banana image slots (optional, graceful without)

Prompts delivered at the end for: (1) foundry-floor atmospheric divider, (2) crucible
close-up for teardown cards, (3) OG/social card. Layout does not depend on them.
