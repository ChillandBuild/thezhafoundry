# Zha Foundry — Brand Assets

Full identity board (with derivation and usage rules):
https://claude.ai/code/artifact/9a064e86-1dfa-4efe-a242-9b3bc4c75524

## Marks

| File | What | Use |
|------|------|-----|
| `stepped-z-copper.svg` | **The logo.** Stepped Z, copper | Nav, footer, avatars — on dark grounds |
| `stepped-z-carbon.svg` | Stepped Z, carbon | On light grounds |
| `stepped-z-heat.svg` | Stepped Z with molten gradient | Hero, loading states, motion moments |
| `seal-hex-z-copper.svg` | Z in hexagonal assay cartouche | Report/teardown seal — on dark |
| `seal-hex-z-carbon.svg` | Seal, carbon | Report/teardown seal — on light |
| `ladder-copper.svg` | Seven-rung ladder (the root form) | Secondary glyph, patterns, timeline rails |
| `ladder-carbon.svg` | Ladder, carbon | Same, on light grounds |
| `ladder-small.svg` | Three-rung simplified ladder | Tiny sizes (≤24px) where seven rungs blur |

## LinkedIn Company Page assets

Source HTML lives in `brand/linkedin/`; run `npm run linkedin:assets` to
regenerate the PNGs after any change to the HTML, `shared.css`, or the brand
tokens they reference.

| File | What | Canvas |
|------|------|--------|
| `linkedin/profile-picture-{dark,light}.png` | Company Page logo | 400×400 |
| `linkedin/cover-banner-{dark,light}.png` | Company Page cover image | 4200×700 |
| `linkedin/launch-post-{dark,light}.png` | First feed post announcing the page | 1080×1080 |

Each ships in both themes; pick one at upload time. Canvas sizes are
LinkedIn's official Company Page spec (not the personal-profile sizes most
third-party guides quote) — see
`docs/superpowers/specs/2026-07-17-linkedin-brand-assets-design.md`.

## Rules

- Square caps, miter joins, never rounded. The mark is struck, not drawn.
- Copper `#e07830` on carbon `#141110`/`#1c1815`; carbon on light `#ece5d9`.
- The heat gradient (`#ffc46b → #ff9a3d → #e07830 → #8a8078`) is a state, not a color —
  use it only where the mark is "hot" (hero, load, active).
- The ladder is the private root of the mark (proto-Tamil ழ, Kodumanal/Edakkal maker's
  marks). The story is not explained in public copy.
