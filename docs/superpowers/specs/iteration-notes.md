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
