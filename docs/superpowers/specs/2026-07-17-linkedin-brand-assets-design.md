# LinkedIn Company Page Assets — Design

## Context

The Zha Foundry needs a LinkedIn Company Page. The brand system is already fully
established on the live site — Stepped Z mark, locked color tokens for foundry
daylight (light) and foundry night (dark) themes, and a three-font system
(Archivo, IBM Plex Mono, Big Shoulders Stencil). This spec does not invent any
new visual language; it applies the existing system to three LinkedIn-specific
formats.

Brand personality (from `PRODUCT.md`): monumental, precise, quiet. No fake
urgency, no manufactured social proof. These assets follow the same rule.

## Scope

Three deliverables, each exported in both themes (dark and light), because the
founder wants the optionality rather than committing to one theme now:

1. Profile picture (Company Page logo)
2. Cover banner
3. Launch-announcement post graphic

No other campaign/event graphics — none are needed yet (no active campaign),
and building them speculatively would be scope creep. More get added when
there's a specific post to support.

## Visual system reuse

All three assets pull directly from existing repo assets — no new SVGs, no new
colors:

- **Mark**: `brand/stepped-z-copper.svg` (dark ground) / `brand/stepped-z-carbon.svg`
  (light ground) / `brand/stepped-z-heat.svg` (heat-gradient variant, used where
  the mark is "hot" — cover banner and launch post, per the existing rule in
  `brand/README.md`).
- **Color tokens** (from `src/styles/tokens.css`):
  - Dark (foundry night): ground `#141110`, text `#f0ebe3`, copper `#e07830`, hot `#ffb25e`
  - Light (foundry daylight): ground `#f2ede4`, text `#1c1815`, copper `#ad4a14`, hot `#c9611f`
  - Heat ramp (used for the mark wherever it's rendered "hot"): `linear-gradient(180deg, #ffc46b, #ff9a3d 38%, #e07830 68%, #8a8078)`
- **Type**: Archivo (weight 800 for headlines), IBM Plex Mono (mono labels/wordmark
  subline), Big Shoulders Stencil Display 700 (wordmark "ZHA" only) — same three
  families already loaded in `src/app/layout.tsx`.

## 1. Profile picture

- **Canvas**: 400×400px (LinkedIn minimum is 300×300; 400 gives retina headroom).
- **Content**: bare Stepped Z mark, centered, with the same proportional padding
  as the source SVG (mark occupies the center ~56% of the canvas — i.e. the
  same 14/64 margin ratio as `stepped-z-copper.svg`'s 64×64 viewBox, scaled up).
  This margin is deliberate: it's what lets the mark survive both circle crop
  (search results, mentions) and rounded-square crop (page header) that
  LinkedIn uses in different placements, without any part of the stroke
  touching the crop edge.
- **Dark export**: copper mark (`#e07830`) on carbon ground (`#141110`).
- **Light export**: carbon mark (`#1c1815`) on cream ground (`#f2ede4`) —
  matching `stepped-z-carbon.svg` exactly. (Not copper-on-light; that would be
  a new, undocumented combination.)
- No wordmark, no text — at avatar sizes (LinkedIn renders this as small as
  ~24px in places), anything beyond the bare mark is illegible noise.

## 2. Cover banner

- **Canvas**: 1584×396px (LinkedIn's recommended upload size).
- **Layout** (mirrors the homepage hero's headline-left / mark-right composition):
  - Headline, upper-left: "You vibe code it." / "We forge it." — second line in
    the theme's hot/copper accent color, matching the hero treatment exactly
    (`src/components/hero/Hero.tsx` copy, reused verbatim — no new copy invented).
  - Wordmark lockup, lower-left: "THE ZHA FOUNDRY" in the existing nav lockup
    style (Big Shoulders Stencil for "ZHA", Plex Mono for the rest).
  - Stepped Z mark, right side, vertically centered, rendered in the heat
    gradient (`stepped-z-heat.svg` treatment) with a soft glow — same visual
    role as the hero's large Z.
  - No readout/telemetry line (e.g. "POUR TEMP 1,084.6°C") — cut per feedback;
    the composition reads cleaner without it at banner scale.
- **Safe zone**: bottom-left 168×168px region stays clear of all content. This
  is where LinkedIn overlays the Company Page logo on top of the cover banner
  on desktop — anything placed there gets covered.
- **Dark and light exports**, same layout, theme tokens swapped.

## 3. Launch-announcement post graphic

- **Canvas**: 1080×1080px (square — best feed real estate on both desktop and
  mobile LinkedIn).
- **Layout**, centered composition:
  - Stepped Z mark, heat gradient, centered near the top.
  - Wordmark lockup below the mark.
  - Headline: "The Zha Foundry is live."
  - Subhead: "Run a free Assay on what you've already shipped." (reuses the
    existing "Run an Assay" CTA language from the site footer — not new copy).
- **No CTA button baked into the image.** The Assay link goes in the LinkedIn
  post's text content, per platform convention — images with embedded "click
  here" style buttons read as generic template marketing, which is exactly
  what the brand's anti-references reject.
- **Dark and light exports**, same layout, theme tokens swapped.

## Production approach

Built as standalone HTML/CSS files under `brand/linkedin/`, reusing the actual
brand SVGs and the real CSS custom properties from `src/styles/tokens.css`
(copied as literal values, since these are static export targets rather than
live app pages) — not hand-built in an external design tool. A small script
renders each HTML file to a pixel-exact PNG at its target canvas size via
Playwright (the project already uses Playwright-style screenshot rendering
for `screenshots/`, so this follows an existing pattern rather than
introducing a new toolchain).

Files:
```
brand/linkedin/
  profile-picture-dark.html    → profile-picture-dark.png    (400×400)
  profile-picture-light.html   → profile-picture-light.png   (400×400)
  cover-banner-dark.html       → cover-banner-dark.png       (1584×396)
  cover-banner-light.html      → cover-banner-light.png      (1584×396)
  launch-post-dark.html        → launch-post-dark.png        (1080×1080)
  launch-post-light.html       → launch-post-light.png       (1080×1080)
  render.mjs                   (renders all six HTML files to PNG)
```

This keeps the assets reproducible: if a token or the mark ever changes, the
LinkedIn assets regenerate with one command instead of being manually
re-exported from a design tool that can drift from the live brand.

## Out of scope

- LinkedIn "About" section copy, company tagline field, industry/size
  metadata — these are page-setup fields, not visual assets, and weren't part
  of this request.
- Any additional post graphics beyond the launch announcement (no active
  campaign to design against yet).
- Animated/video cover — LinkedIn Company Pages don't support video covers.
