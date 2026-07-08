# Iteration pass notes

## Pass 1 — 2026-07-08 (30 screenshots: 320/768/1440 × dark/light + 10 sections)

Working well: pour narrative reads end-to-end (nav gauge hits exactly 24.0 °C at the
footer), seam+tip+drips, runners, stepped rules, tier ingot gauges, care console,
process ghost numerals, reality transformation chamber (esp. light theme), manifesto
stamps, footer bookend.

Problems found → fixes:

1. **Extruded Z reads as a flat blob with a harsh sticker-shadow (worst in light).**
   Layers stack at identical x/y so no depth reads statically; drop-shadow too dark.
   → static base tilt on the billet (rotateX 13° / rotateY −16°) so translateZ layers
   actually displace; theme-aware softer shadow; graded layer colors.
2. **Headline glyphs wrap mid-word** ("You vibe / code it." breaks with a leading
   space indent). → split into word groups (nowrap) containing char spans.
3. **Molten field too timid** — barely visible dark, invisible light. → larger mask,
   higher opacity both themes.
4. **Rotating hex seal reads as a crooked logo in any static moment.** → hex stays
   upright; a dashed machining-jig ring rotates around it instead.
5. **Pour mold at the contact section too small/grey** — reads as a stray glyph.
   → larger, copper walls, brighter melt glow.
6. **Dark-theme vignette too heavy** in corners. → alpha 0.5 → 0.32.
7. **Nav crowds/clips at 320** ("Bring a project" cut off). → compact paddings and
   hide the nav subline under 520 px.

## Pass 2 — 2026-07-08 (30 fresh screenshots after pass-1 fixes)

Confirmed fixed: billet reads 3D in both themes, word-boundary wrapping, seal jig,
mold, mobile nav. Refinements shipped this pass:

1. Molten field grew **ridged vein filaments** (pow-6 ridge noise added to the fbm
   field) — the melt now has structure, not just haze.
2. **Hero CTA row added** (labels reused from approved copy: "Run the assay",
   "Bring a project") — the hero previously had no action; joins the entrance pour
   and the magnetic system.
3. **Contact fields** now get the same focus heat line as the assay intake — one
   machined-slot language across every input on the floor.
4. **Crucible pools** brightened (hot core added, tighter blur) — were nearly
   invisible in dark.
5. **Section h2s** rise on arrival so headings join the station-online choreography.

## Pass 3 — 2026-07-08 (a11y / motion / perf)

- All 7 Playwright e2e green (incl. reduced-motion visibility + keyboard order +
  no horizontal overflow at 320–1440).
- Reduced-motion verified by screenshot: checklist renders pre-checked, seal
  upright with static jig, no hidden content, seam static at 0.3 opacity.
- Assay interaction verified: specimen ticket stamps live, heat line ignites on
  focus, browser focus ring intact.
- 14/14 unit tests green; production build clean.
- JS weight: all chunks ~232 kb gz **total**, of which gsap core + ScrollTrigger
  (~41 kb gz) load lazily post-paint; first-load stays within the landing budget.
  No new dependencies were added for any of the 25 concepts.
- Known accepted trade-offs: seam displacement filter animates via SMIL (paints a
  4 px-wide fixed layer only); WebGL field renders at 0.6× DPR-capped resolution
  and pauses offscreen/hidden; ember canvas capped at 30 particles + burst.
