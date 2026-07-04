# The Zha Foundry Landing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Zha Foundry landing site — dark foundry aesthetic, Stepped Z identity, Assay-led funnel with two cores (Cast + Forge) — per the approved spec at `docs/superpowers/specs/2026-07-05-zha-foundry-landing-design.md`.

**Architecture:** Static-rendered Next.js App Router page composed of feature-organized section components. One server action handles both lead capture paths (assay link + contact form) with zod validation, stubbed delivery (server log + TODO). One client motion component dynamically imports GSAP/ScrollTrigger for the pour-seam, stage ignition, and reveals; the hero heat sequence is pure CSS. Unit tests (Vitest) cover validation and the action; Playwright covers smoke + screenshots.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, vanilla CSS with tokens, `next/font` (Archivo + IBM Plex Mono), zod, GSAP (dynamic import), Vitest, Playwright.

## Global Constraints

- Dark theme only: ground `#141110`, surface `#1c1815`, line `#2e2822`, text `#f0ebe3`, muted `#9b9288`, faint `#6b645c`, copper `#e07830`, hot `#ffb25e`, deep `#b34a16`, steel `#8a8078`.
- Fonts: Archivo (500, 800) + IBM Plex Mono (400, 500) only, via `next/font/google`.
- **No prices anywhere.** Tiers show deliverables + "Fixed quote with your free assay."
- **No fake proof:** no testimonials, no logos, no invented case studies. Teardown slots say "in the crucible."
- The ladder/ழ derivation story appears nowhere in public copy.
- Motion: compositor-friendly properties only (`transform`, `opacity`); everything disabled under `prefers-reduced-motion: reduce`; GSAP dynamically imported.
- Performance: landing JS < 150 kb gzipped; explicit dimensions on all media; LCP element is the hero headline (text).
- Accessibility: semantic landmarks, visible `:focus-visible` states, WCAG AA contrast, all sections reachable by keyboard.
- Copy register: plain verbs, sentence case for prose, mono uppercase for spec labels. No filler ("trusted by teams worldwide" is banned).
- Commits: `<type>: <description>` format, no attribution footer.

---

### Task 1: Dependencies, tokens, fonts, layout shell

**Files:**
- Modify: `package.json` (scripts)
- Create: `src/styles/tokens.css`
- Modify: `src/app/globals.css` (replace scaffold content)
- Modify: `src/app/layout.tsx` (replace scaffold content)
- Delete: `src/app/page.module.css`
- Modify: `src/app/page.tsx` (placeholder shell, replaced in Task 9)
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: CSS custom properties (`--ground`, `--copper`, etc.), utility classes `.container`, `.section`, `.eyebrow`, `.mono`, `.btn`, `.btn-ghost`, `.field`; font CSS vars `--font-archivo`, `--font-plex-mono`. All later tasks style against these.

- [ ] **Step 1: Install dependencies**

```bash
npm install
npm install zod gsap
npm install -D vitest @playwright/test
```

Expected: lockfile updated, no errors.

- [ ] **Step 2: Add test scripts to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "vitest run",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
```

- [ ] **Step 4: Create `src/styles/tokens.css`**

```css
:root {
  --ground: #141110;
  --surface: #1c1815;
  --surface-2: #211c18;
  --line: #2e2822;
  --text: #f0ebe3;
  --muted: #9b9288;
  --faint: #6b645c;
  --copper: #e07830;
  --hot: #ffb25e;
  --deep: #b34a16;
  --steel: #8a8078;
  --light-tile: #ece5d9;

  --text-base: clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
  --text-hero: clamp(2.5rem, 1.1rem + 5.6vw, 5.4rem);
  --text-h2: clamp(1.6rem, 1.1rem + 1.6vw, 2.4rem);
  --space-section: clamp(4.5rem, 3rem + 6vw, 9rem);

  --dur-fast: 150ms;
  --dur: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --container: 1120px;
}
```

- [ ] **Step 5: Replace `src/app/globals.css`**

```css
@import '../styles/tokens.css';

*, *::before, *::after { box-sizing: border-box; }

html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

body {
  margin: 0;
  background: var(--ground);
  color: var(--text);
  font-family: var(--font-archivo), system-ui, sans-serif;
  font-weight: 500;
  font-size: var(--text-base);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 { font-weight: 800; letter-spacing: -0.015em; line-height: 1.05; margin: 0; text-wrap: balance; }
h2 { font-size: var(--text-h2); }
p { margin: 0; }
a { color: inherit; }
img, svg { display: block; max-width: 100%; }
button { font: inherit; cursor: pointer; }
input, textarea { font: inherit; }

:focus-visible { outline: 2px solid var(--copper); outline-offset: 3px; }

.container { max-width: var(--container); margin-inline: auto; padding-inline: 24px; }
.section { padding-block: var(--space-section); border-top: 1px solid var(--line); }

.mono { font-family: var(--font-plex-mono), ui-monospace, monospace; }
.eyebrow {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 12px; font-weight: 500; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--copper); margin: 0 0 18px;
}
.section-sub { color: var(--muted); max-width: 62ch; margin-top: 14px; }

.btn {
  display: inline-block; background: var(--copper); color: var(--ground);
  border: 1px solid var(--copper); padding: 14px 26px;
  font-weight: 800; font-size: 0.95rem; letter-spacing: 0.04em;
  text-decoration: none; transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast);
}
.btn:hover { background: var(--hot); border-color: var(--hot); transform: translateY(-1px); }
.btn-ghost {
  background: transparent; color: var(--text); border-color: var(--line);
}
.btn-ghost:hover { background: var(--surface); border-color: var(--faint); transform: translateY(-1px); }

.field {
  background: var(--surface); border: 1px solid var(--line); color: var(--text);
  padding: 13px 16px; width: 100%;
  transition: border-color var(--dur-fast);
}
.field::placeholder { color: var(--faint); }
.field:focus { border-color: var(--copper); outline: none; }

[data-reveal] { will-change: transform, opacity; }
```

- [ ] **Step 6: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['500', '800'],
  variable: '--font-archivo',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Zha Foundry — You vibe code it. We forge it.',
  description:
    'The independent foundry for AI-built software. We pour new AI-native products, take prompt-built prototypes to production, and keep both alive — verified by a human who signs their name.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Delete `src/app/page.module.css`, replace `src/app/page.tsx` with a shell**

```tsx
export default function Home() {
  return (
    <main>
      <h1>The Zha Foundry</h1>
    </main>
  );
}
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: compiles with no errors, `/` prerendered as static.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: tokens, fonts, layout shell, test tooling"
```

---

### Task 2: Lead validation library (TDD)

**Files:**
- Create: `src/lib/leads.ts`
- Test: `tests/unit/leads.test.ts`

**Interfaces:**
- Produces: `leadSchema` (zod), type `Lead`, `validateLead(input: unknown): { ok: true; lead: Lead } | { ok: false; error: string }`. Task 3 consumes `validateLead`.

- [ ] **Step 1: Write the failing test `tests/unit/leads.test.ts`**

```ts
import { describe, expect, test } from 'vitest';
import { validateLead } from '../../src/lib/leads';

describe('validateLead', () => {
  test('accepts a valid assay lead', () => {
    const res = validateLead({ kind: 'assay', link: 'github.com/acme/app', email: 'a@b.co' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.lead.kind).toBe('assay');
  });

  test('rejects assay lead with invalid email', () => {
    const res = validateLead({ kind: 'assay', link: 'github.com/acme/app', email: 'nope' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/email/i);
  });

  test('rejects assay lead with empty link', () => {
    const res = validateLead({ kind: 'assay', link: '  ', email: 'a@b.co' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/link/i);
  });

  test('accepts a valid contact lead without a link', () => {
    const res = validateLead({
      kind: 'contact', name: 'Prem', email: 'a@b.co', link: '', message: 'Build my idea.',
    });
    expect(res.ok).toBe(true);
  });

  test('rejects contact lead with empty message', () => {
    const res = validateLead({ kind: 'contact', name: 'Prem', email: 'a@b.co', link: '', message: '' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/message/i);
  });

  test('rejects unknown kind', () => {
    const res = validateLead({ kind: 'spam' });
    expect(res.ok).toBe(false);
  });

  test('trims whitespace on fields', () => {
    const res = validateLead({ kind: 'assay', link: ' github.com/a/b ', email: ' a@b.co ' });
    expect(res.ok).toBe(true);
    if (res.ok && res.lead.kind === 'assay') expect(res.lead.link).toBe('github.com/a/b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `src/lib/leads`.

- [ ] **Step 3: Write `src/lib/leads.ts`**

```ts
import { z } from 'zod';

const email = z
  .string()
  .trim()
  .max(200, 'That email is too long.')
  .email('Enter a valid email so the report can reach you.');

export const leadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('assay'),
    link: z
      .string()
      .trim()
      .min(4, 'Paste a project link — GitHub, Replit, Lovable, or a live URL.')
      .max(300, 'That link is too long.'),
    email,
  }),
  z.object({
    kind: z.literal('contact'),
    name: z.string().trim().min(1, 'Add your name.').max(120, 'That name is too long.'),
    email,
    link: z.string().trim().max(300, 'That link is too long.').optional().default(''),
    message: z
      .string()
      .trim()
      .min(1, 'Say a line about the project or idea — the message is empty.')
      .max(4000, 'Keep the message under 4,000 characters.'),
  }),
]);

export type Lead = z.infer<typeof leadSchema>;

export function validateLead(
  input: unknown,
): { ok: true; lead: Lead } | { ok: false; error: string } {
  const parsed = leadSchema.safeParse(input);
  if (parsed.success) return { ok: true, lead: parsed.data };
  const issue = parsed.error.issues[0];
  const field = String(issue?.path?.[0] ?? '');
  const message = issue?.message ?? 'Check the form and try again.';
  return { ok: false, error: field && !/email|link|message|name/i.test(message) ? `${field}: ${message}` : message };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/leads.ts tests/unit/leads.test.ts
git commit -m "feat: lead validation schema with friendly errors"
```

---

### Task 3: Lead server action (TDD)

**Files:**
- Create: `src/app/actions.ts`
- Test: `tests/unit/actions.test.ts`

**Interfaces:**
- Consumes: `validateLead` from `src/lib/leads.ts`.
- Produces: `type LeadState = { status: 'idle' | 'sent' | 'error'; message: string }` and `submitLead(prev: LeadState, formData: FormData): Promise<LeadState>`. Tasks 5 and 8 consume both via `useActionState`.

- [ ] **Step 1: Write the failing test `tests/unit/actions.test.ts`**

```ts
import { describe, expect, test } from 'vitest';
import { submitLead } from '../../src/app/actions';

const idle = { status: 'idle' as const, message: '' };

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe('submitLead', () => {
  test('valid assay submission returns sent state with 48-hour promise', async () => {
    const res = await submitLead(idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'a@b.co' }));
    expect(res.status).toBe('sent');
    expect(res.message).toMatch(/48 hours/);
  });

  test('valid contact submission returns sent state', async () => {
    const res = await submitLead(
      idle,
      fd({ kind: 'contact', name: 'P', email: 'a@b.co', link: '', message: 'hi' }),
    );
    expect(res.status).toBe('sent');
    expect(res.message).toMatch(/human/i);
  });

  test('invalid submission returns error state with the validation message', async () => {
    const res = await submitLead(idle, fd({ kind: 'assay', link: 'github.com/a/b', email: 'bad' }));
    expect(res.status).toBe('error');
    expect(res.message).toMatch(/email/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `src/app/actions`.

- [ ] **Step 3: Write `src/app/actions.ts`**

```ts
'use server';

import { validateLead } from '../lib/leads';

export type LeadState = { status: 'idle' | 'sent' | 'error'; message: string };

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const result = validateLead({
    kind: formData.get('kind'),
    link: formData.get('link') ?? undefined,
    email: formData.get('email') ?? undefined,
    name: formData.get('name') ?? undefined,
    message: formData.get('message') ?? undefined,
  });

  if (!result.ok) return { status: 'error', message: result.error };

  // TODO(launch): deliver the lead — wire Resend (email) or a Slack webhook here.
  // Until then it lands in the server log so no submission is silently lost.
  console.log('[zha-lead]', JSON.stringify(result.lead));

  return {
    status: 'sent',
    message:
      result.lead.kind === 'assay'
        ? 'Link received. Your assay report lands in your inbox within 48 hours.'
        : 'Received. A human replies within one working day.',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: 10 passed (7 from Task 2 + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/app/actions.ts tests/unit/actions.test.ts
git commit -m "feat: lead server action with stubbed delivery"
```

---

### Task 4: Brand mark components + favicon

**Files:**
- Create: `src/components/marks/Marks.tsx`
- Create: `src/app/icon.svg`
- Delete: `src/app/favicon.ico`, `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`

**Interfaces:**
- Produces: `SteppedZ({ className?, stroke? })`, `SteppedZHeat({ className? })`, `SealHexZ({ className?, stroke? })`, `LadderRail({ className?, stroke? })` — all render fixed-viewBox SVGs sized by CSS. Consumed by Tasks 5–8.

- [ ] **Step 1: Write `src/components/marks/Marks.tsx`**

Geometry is copied exactly from `brand/*.svg` — do not redraw it.

```tsx
type MarkProps = { className?: string; stroke?: string };

const Z_POINTS = '14,14 50,14 50,23 38,23 38,32 26,32 26,41 14,41 14,50 50,50';

export function SteppedZ({ className, stroke = 'var(--copper)' }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <polyline points={Z_POINTS} stroke={stroke} strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    </svg>
  );
}

export function SteppedZHeat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="zha-heat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc46b" />
          <stop offset="0.38" stopColor="#ff9a3d" />
          <stop offset="0.68" stopColor="#e07830" />
          <stop offset="1" stopColor="#8a8078" />
        </linearGradient>
      </defs>
      <polyline points={Z_POINTS} stroke="url(#zha-heat)" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    </svg>
  );
}

export function SealHexZ({ className, stroke = 'var(--copper)' }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M32 3 L57 17 V47 L32 61 L7 47 V17 Z" stroke={stroke} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
      <polyline
        points="21.2,21.2 42.8,21.2 42.8,26.6 35.6,26.6 35.6,32 28.4,32 28.4,37.4 21.2,37.4 21.2,42.8 42.8,42.8"
        stroke={stroke} strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" fill="none"
      />
    </svg>
  );
}

export function LadderRail({ className, stroke = 'var(--line)' }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M24 9 V57 M40 9 V57" stroke={stroke} strokeWidth="4" strokeLinecap="square" />
      <path d="M17 12 H47 M17 19 H47 M17 26 H47 M17 33 H47 M17 40 H47 M17 47 H47 M17 54 H47" stroke={stroke} strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}
```

- [ ] **Step 2: Create `src/app/icon.svg`** (Next serves this as the favicon; three-rung small variant for legibility)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" fill="#141110"/>
  <polyline points="14,16 50,16 50,26 38,26 38,38 26,38 26,48 14,48 14,48 50,48"
    stroke="#e07830" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>
</svg>
```

- [ ] **Step 3: Delete scaffold assets**

```bash
rm src/app/favicon.ico public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: compiles; `/icon.svg` route emitted.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: brand mark components and stepped-Z favicon"
```

---

### Task 5: Nav + Hero with Assay input

**Files:**
- Create: `src/components/nav/SiteNav.tsx`, `src/components/nav/nav.css`
- Create: `src/components/hero/Hero.tsx`, `src/components/hero/AssayForm.tsx`, `src/components/hero/hero.css`

**Interfaces:**
- Consumes: `SteppedZ`, `SteppedZHeat` from Task 4; `submitLead`, `LeadState` from Task 3.
- Produces: `<SiteNav />`, `<Hero />` — composed by Task 9. Section anchors used by nav: `#cast`, `#forge`, `#care`, `#standard`, `#teardowns`, `#contact`; hero owns `#assay`.

- [ ] **Step 1: Create `src/components/nav/nav.css`**

```css
.nav {
  position: sticky; top: 0; z-index: 20;
  background: color-mix(in srgb, var(--ground) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-block: 14px; }
.nav-lockup { display: flex; align-items: center; gap: 12px; text-decoration: none; }
.nav-lockup svg { width: 30px; height: 30px; }
.nav-wordmark { font-weight: 800; font-size: 14px; letter-spacing: 0.18em; }
.nav-wordmark em { font-style: normal; color: var(--copper); }
.nav-links { display: flex; gap: 26px; list-style: none; margin: 0; padding: 0; }
.nav-links a {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--muted); text-decoration: none; transition: color var(--dur-fast);
}
.nav-links a:hover { color: var(--copper); }
@media (max-width: 760px) { .nav-links { display: none; } }
```

- [ ] **Step 2: Create `src/components/nav/SiteNav.tsx`**

```tsx
import { SteppedZ } from '../marks/Marks';
import './nav.css';

const LINKS = [
  ['#cast', 'Cast'],
  ['#forge', 'Forge'],
  ['#care', 'Care'],
  ['#standard', 'Standard'],
  ['#teardowns', 'Teardowns'],
] as const;

export function SiteNav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a href="#top" className="nav-lockup" aria-label="The Zha Foundry — back to top">
          <SteppedZ />
          <span className="nav-wordmark">THE <em>ZHA</em> FOUNDRY</span>
        </a>
        <nav aria-label="Main navigation">
          <ul className="nav-links">
            {LINKS.map(([href, label]) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </nav>
        <a className="btn btn-ghost" href="#contact">Bring a project</a>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `src/components/hero/hero.css`**

```css
.hero { position: relative; padding-block: clamp(5rem, 4rem + 6vw, 9.5rem) var(--space-section); overflow: hidden; }
.hero-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 48px; align-items: center; }
@media (max-width: 860px) { .hero-grid { grid-template-columns: 1fr; } }

.hero-readout {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 11.5px; font-weight: 500; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--copper); margin-bottom: 22px;
}
.hero-readout span { color: var(--faint); }

.hero-title { font-size: var(--text-hero); }
.hero-title .forge-line { color: var(--copper); }

.hero-sub { color: var(--muted); max-width: 56ch; margin-top: 22px; font-size: 1.05rem; }
.hero-sub strong { color: var(--text); font-weight: 500; }

.hero-mark { position: relative; width: min(300px, 60vw); margin-inline: auto; aspect-ratio: 1; }
.hero-mark svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.hero-mark .mark-heat { filter: drop-shadow(0 0 18px rgba(224, 120, 48, 0.45)); }
@media (prefers-reduced-motion: no-preference) {
  .hero-mark .mark-heat { animation: cool 2.4s var(--ease-out) 0.4s forwards; }
  .hero-mark .mark-solid { opacity: 0; animation: solidify 2.4s var(--ease-out) 0.4s forwards; }
  @keyframes cool { to { opacity: 0; } }
  @keyframes solidify { to { opacity: 1; } }
}
@media (prefers-reduced-motion: reduce) { .hero-mark .mark-heat { display: none; } }

.assay { margin-top: 40px; max-width: 560px; }
.assay-label { font-weight: 800; font-size: 0.98rem; margin-bottom: 12px; display: block; }
.assay-row { display: flex; gap: 10px; flex-wrap: wrap; }
.assay-row .field { flex: 1 1 200px; }
.assay-note {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--faint); margin-top: 12px;
}
.assay-alt { margin-top: 18px; font-size: 0.95rem; }
.assay-alt a { color: var(--copper); text-decoration: none; }
.assay-alt a:hover { text-decoration: underline; }

.form-status { margin-top: 14px; font-size: 0.95rem; }
.form-status[data-status='sent'] { color: var(--hot); }
.form-status[data-status='error'] { color: #e2a48a; }
```

- [ ] **Step 4: Create `src/components/hero/AssayForm.tsx`** (client)

```tsx
'use client';

import { useActionState } from 'react';
import { submitLead, type LeadState } from '../../app/actions';

const initial: LeadState = { status: 'idle', message: '' };

export function AssayForm() {
  const [state, action, pending] = useActionState(submitLead, initial);

  return (
    <form className="assay" action={action}>
      <input type="hidden" name="kind" value="assay" />
      <label className="assay-label" htmlFor="assay-link">
        Paste your project link. Get a free assay.
      </label>
      <div className="assay-row">
        <input id="assay-link" name="link" className="field" placeholder="github.com/you/your-app" autoComplete="url" />
        <input name="email" type="email" className="field" placeholder="you@company.com" autoComplete="email" aria-label="Email for the report" />
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Reading…' : 'Run the assay'}
        </button>
      </div>
      <p className="assay-note">Free · Security, tests, cost, scale · Read and signed by a human</p>
      {state.status !== 'idle' && (
        <p className="form-status" data-status={state.status} role="status">{state.message}</p>
      )}
      <p className="assay-alt">
        No repo yet? <a href="#contact">Bring an idea instead →</a>
      </p>
    </form>
  );
}
```

- [ ] **Step 5: Create `src/components/hero/Hero.tsx`**

```tsx
import { SteppedZ, SteppedZHeat } from '../marks/Marks';
import { AssayForm } from './AssayForm';
import './hero.css';

export function Hero() {
  return (
    <section className="hero" id="assay" aria-labelledby="hero-heading">
      <div className="container hero-grid">
        <div>
          <p className="hero-readout">
            Pour temp 1,084.6 °C — Cu <span>·</span> Independent software foundry
          </p>
          <h1 className="hero-title" id="hero-heading">
            You vibe code it.<br />
            <span className="forge-line">We forge it.</span>
          </h1>
          <p className="hero-sub">
            The independent foundry for AI-built software. We pour new AI-native products,
            take prompt-built prototypes to production, and keep both alive —{' '}
            <strong>audited, hardened, and verified by a human who signs their name.</strong>
          </p>
          <AssayForm />
        </div>
        <div className="hero-mark" aria-hidden="true">
          <SteppedZ className="mark-solid" />
          <SteppedZHeat className="mark-heat" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Mount temporarily in `src/app/page.tsx` and verify**

```tsx
import { SiteNav } from '../components/nav/SiteNav';
import { Hero } from '../components/hero/Hero';

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top">
        <Hero />
      </main>
    </>
  );
}
```

Run: `npm run build`
Expected: compiles; static page.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: nav and hero with assay lead form"
```

---

### Task 6: Two Doors, Reality Check, Forge tiers, Care strip

**Files:**
- Create: `src/components/doors/TwoDoors.tsx`, `src/components/doors/doors.css`
- Create: `src/components/reality/RealityCheck.tsx`, `src/components/reality/reality.css`
- Create: `src/components/tiers/ForgeTiers.tsx`, `src/components/tiers/tiers.css`
- Create: `src/components/care/FoundryCare.tsx`, `src/components/care/care.css`

**Interfaces:**
- Produces: `<TwoDoors />` (owns `#cast` on the Cast card and `#forge` on the Forge card), `<RealityCheck />`, `<ForgeTiers />`, `<FoundryCare />` (owns `#care`). Composed by Task 9. All reveal-animated blocks carry `data-reveal`.

- [ ] **Step 1: Create `src/components/doors/doors.css`**

```css
.doors-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 40px; }
@media (max-width: 860px) { .doors-grid { grid-template-columns: 1fr; } }
.door { background: var(--surface); border: 1px solid var(--line); padding: 34px 30px; }
.door-tag {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 11px; font-weight: 500; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--copper); margin-bottom: 14px;
}
.door h3 { font-size: 1.45rem; margin-bottom: 14px; }
.door p { color: var(--muted); }
.door p strong { color: var(--text); font-weight: 500; }
.door-line {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  margin-top: 24px;
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 10.5px; letter-spacing: 0.1em; color: var(--muted);
}
.door-line .gate { color: var(--copper); }
.door-line .arrow { color: var(--faint); }
```

- [ ] **Step 2: Create `src/components/doors/TwoDoors.tsx`**

```tsx
import './doors.css';

const CAST_LINE = ['PRD', 'SCHEMA', 'CODE', 'TESTS', 'DEPLOY'];

export function TwoDoors() {
  return (
    <section className="section" aria-labelledby="doors-heading">
      <div className="container">
        <p className="eyebrow">Two doors, one production line</p>
        <h2 id="doors-heading">Bring an idea, or bring a prototype. Both leave forged.</h2>
        <div className="doors-grid">
          <article className="door" id="cast" data-reveal>
            <p className="door-tag">Door 01 — The Cast</p>
            <h3>Bring an idea. We pour the product.</h3>
            <p>
              An agent assembly line builds it: a PM agent drafts the requirements, an architect
              agent designs the data model, engineer agents write the code, QA agents try to break
              it. <strong>Every stage ends at a human gate — nothing ships unreviewed.</strong>{' '}
              Fixed-scope MVP sprints. Born forged: verified against the Zha Standard from day one.
            </p>
            <p className="door-line" aria-label="Cast pipeline stages">
              {CAST_LINE.map((stage, i) => (
                <span key={stage}>
                  {stage} <span className="gate" title="Human sign-off">⌖</span>
                  {i < CAST_LINE.length - 1 && <span className="arrow"> → </span>}
                </span>
              ))}
            </p>
          </article>
          <article className="door" id="forge" data-reveal>
            <p className="door-tag">Door 02 — The Forge</p>
            <h3>Bring a prototype. We make it production.</h3>
            <p>
              Your app works in the demo and breaks everywhere else. We refactor the architecture,
              harden auth and secrets, build the test suite, containerize it, wire zero-downtime
              deploys, and cut the token bill. <strong>Specialty: Next.js + Supabase apps from
              Lovable, Bolt, v0, and Cursor</strong> — the stack most AI tools generate.
            </p>
            <p className="door-line" aria-label="Forge pipeline stages">
              INTAKE <span className="arrow">→</span> AUDIT <span className="arrow">→</span> HARDEN{' '}
              <span className="arrow">→</span> VERIFY <span className="gate" title="Human sign-off">⌖</span>{' '}
              <span className="arrow">→</span> SHIP
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/reality/reality.css`**

```css
.reality-table { width: 100%; border-collapse: collapse; margin-top: 40px; }
.reality-table caption { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.reality-table th {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase;
  text-align: left; padding: 14px 18px; border-bottom: 1px solid var(--line);
}
.reality-table th.in { color: var(--steel); }
.reality-table th.out { color: var(--copper); }
.reality-table td { padding: 18px; border-bottom: 1px solid var(--line); vertical-align: top; }
.reality-table td.in { color: var(--steel); }
.reality-table td.out { color: var(--text); border-left: 1px solid var(--line); }
.reality-scroll { overflow-x: auto; }
.reality-table { min-width: 560px; }
```

- [ ] **Step 4: Create `src/components/reality/RealityCheck.tsx`**

```tsx
import './reality.css';

const ROWS: Array<[string, string]> = [
  ['"Works on my machine" local environment', 'Cloud-native, auto-scaling architecture'],
  ['Brittle code and silent runtime failures', 'Engineered test coverage, verified before handover'],
  ['Exposed API keys and prompt-injection risk', 'Hardened security, encryption, and proper auth'],
  ['Token-bloated, expensive LLM calls', 'Optimized model routing and semantic caching'],
];

export function RealityCheck() {
  return (
    <section className="section" aria-labelledby="reality-heading">
      <div className="container">
        <p className="eyebrow">The reality check</p>
        <h2 id="reality-heading">What comes in. What goes out.</h2>
        <div className="reality-scroll" data-reveal>
          <table className="reality-table">
            <caption>Comparison of vibe-coded input versus Zha Foundry output</caption>
            <thead>
              <tr>
                <th className="in" scope="col">Raw material — the vibe-coded input</th>
                <th className="out" scope="col">Cast metal — the foundry output</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([input, output]) => (
                <tr key={output}>
                  <td className="in">{input}</td>
                  <td className="out">{output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `src/components/tiers/tiers.css`**

```css
.tiers-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 40px; }
@media (max-width: 860px) { .tiers-grid { grid-template-columns: 1fr; } }
.tier { background: var(--surface); border: 1px solid var(--line); padding: 30px 26px; display: flex; flex-direction: column; }
.tier.featured { border-color: var(--copper); }
.tier-name { font-weight: 800; font-size: 1.25rem; margin-bottom: 6px; }
.tier-for {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--faint); margin-bottom: 20px;
}
.tier ul { list-style: none; margin: 0 0 24px; padding: 0; display: grid; gap: 10px; color: var(--muted); font-size: 0.95rem; }
.tier li::before { content: '—'; color: var(--copper); margin-right: 10px; }
.tier-quote {
  margin-top: auto;
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--copper);
}
```

- [ ] **Step 6: Create `src/components/tiers/ForgeTiers.tsx`**

```tsx
import './tiers.css';

const TIERS = [
  {
    name: 'Audit',
    forWho: 'Know where you stand',
    featured: false,
    items: [
      'Full assay: security, secrets, tests, scaling, token spend',
      'Prioritized fix plan, ranked by risk',
      'A written report a non-engineer can read',
    ],
  },
  {
    name: 'Harden',
    forWho: 'Make it safe to grow',
    featured: true,
    items: [
      'Everything in Audit',
      'Auth and secrets fixed, security holes closed',
      'Test suite built to agreed coverage',
      'Re-assayed and signed before handover',
    ],
  },
  {
    name: 'Full Forge',
    forWho: 'Make it production',
    featured: false,
    items: [
      'Everything in Harden',
      'Architecture refactor and containerization',
      'CI/CD with zero-downtime deploys',
      'Token-cost optimization and handover docs',
    ],
  },
] as const;

export function ForgeTiers() {
  return (
    <section className="section" aria-labelledby="tiers-heading">
      <div className="container">
        <p className="eyebrow">The Forge — productized, never hourly</p>
        <h2 id="tiers-heading">Three heats. Fixed scope, fixed quote.</h2>
        <div className="tiers-grid">
          {TIERS.map((tier) => (
            <article key={tier.name} className={tier.featured ? 'tier featured' : 'tier'} data-reveal>
              <h3 className="tier-name">{tier.name}</h3>
              <p className="tier-for">{tier.forWho}</p>
              <ul>
                {tier.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="tier-quote">Fixed quote with your free assay</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create `src/components/care/care.css`**

```css
.care { background: var(--surface); border: 1px solid var(--line); padding: 40px 34px; display: grid; grid-template-columns: minmax(0, 1.5fr) auto; gap: 28px; align-items: center; margin-top: 0; }
@media (max-width: 760px) { .care { grid-template-columns: 1fr; } }
.care h3 { font-size: 1.45rem; margin-bottom: 12px; }
.care p { color: var(--muted); max-width: 58ch; }
.care-list {
  margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px 22px;
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--faint);
  list-style: none; padding: 0;
}
```

- [ ] **Step 8: Create `src/components/care/FoundryCare.tsx`**

```tsx
import './care.css';

const WATCHES = ['Dependencies patched', 'CVEs closed', 'Uptime watched', 'Token costs tracked', 'Monthly report, signed'];

export function FoundryCare() {
  return (
    <section className="section" id="care" aria-labelledby="care-heading">
      <div className="container">
        <div className="care" data-reveal>
          <div>
            <p className="eyebrow">Foundry Care</p>
            <h3 id="care-heading">The foundry doesn&apos;t leave.</h3>
            <p>
              Software rots from day one — dependencies decay, CVEs appear, costs drift. Care is a
              monthly subscription: our agents watch, patch, and report; a human signs every
              month&apos;s health check.
            </p>
            <ul className="care-list">
              {WATCHES.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
          <a className="btn btn-ghost" href="#contact">Ask about Care</a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Mount all four in `src/app/page.tsx`** (after `<Hero />`, in order: `<TwoDoors />`, `<RealityCheck />`, `<ForgeTiers />`, `<FoundryCare />`), run `npm run build`.
Expected: compiles.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: two doors, reality check table, forge tiers, care strip"
```

---

### Task 7: Process line, What-we-don't-do, Zha Standard, Teardowns

**Files:**
- Create: `src/components/process/ProcessLine.tsx`, `src/components/process/process.css`
- Create: `src/components/manifesto/Manifesto.tsx`, `src/components/manifesto/manifesto.css`
- Create: `src/components/standard/ZhaStandard.tsx`, `src/components/standard/standard.css`
- Create: `src/components/teardowns/Teardowns.tsx`, `src/components/teardowns/teardowns.css`

**Interfaces:**
- Consumes: `SealHexZ` from Task 4.
- Produces: `<ProcessLine />` (`#process`), `<Manifesto />`, `<ZhaStandard />` (`#standard`), `<Teardowns />` (`#teardowns`). Process stages carry `data-ignite` (Task 8 wires ignition); other blocks carry `data-reveal`.

- [ ] **Step 1: Create `src/components/process/process.css`**

```css
.process-list { list-style: none; margin: 48px 0 0; padding: 0; position: relative; }
.process-list::before {
  content: ''; position: absolute; left: 7px; top: 8px; bottom: 8px;
  width: 2px; background: var(--line);
}
.stage { position: relative; padding: 0 0 44px 44px; opacity: 1; }
.stage:last-child { padding-bottom: 0; }
.stage::before {
  content: ''; position: absolute; left: 0; top: 6px; width: 16px; height: 16px;
  background: var(--ground); border: 2px solid var(--steel);
}
.stage.lit::before { border-color: var(--copper); background: var(--copper); }
.stage-tag {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--steel); margin-bottom: 8px; transition: color var(--dur) var(--ease-out);
}
.stage.lit .stage-tag { color: var(--copper); }
.stage h3 { font-size: 1.2rem; margin-bottom: 8px; }
.stage p { color: var(--muted); max-width: 58ch; }
```

- [ ] **Step 2: Create `src/components/process/ProcessLine.tsx`**

```tsx
import './process.css';

const STAGES = [
  ['Stage 01 — Intake & Audit', 'The material arrives', 'A repo link or an idea brief. We assay what exists and scope what should.'],
  ['Stage 02 — Blueprint', 'Architect and PM agents draw the plan', 'Requirements broken down, production schema designed, scope fixed in writing.'],
  ['Stage 03 — Assembly', 'The agent loops run', 'Engineer and QA agents write, test, refactor, and re-test until every assertion holds.'],
  ['Stage 04 — Human Review', 'A person signs their name', 'Every line the agents produced gets read, challenged, and approved by a human engineer.'],
  ['Stage 05 — Shipment', 'Cast metal leaves the floor', 'A running production environment, handover docs, and the option to keep us watching.'],
] as const;

export function ProcessLine() {
  return (
    <section className="section" id="process" aria-labelledby="process-heading">
      <div className="container">
        <p className="eyebrow">The production line</p>
        <h2 id="process-heading">Five stages. Both doors. Same exit.</h2>
        <ol className="process-list">
          {STAGES.map(([tag, title, body]) => (
            <li key={tag} className="stage" data-ignite>
              <p className="stage-tag">{tag}</p>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/manifesto/manifesto.css`**

```css
.manifesto-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-top: 40px; }
@media (max-width: 760px) { .manifesto-grid { grid-template-columns: 1fr; } }
.refusal { border: 1px solid var(--line); padding: 26px 24px; }
.refusal h3 { font-size: 1.1rem; margin-bottom: 10px; }
.refusal h3::before { content: '✕ '; color: var(--copper); }
.refusal p { color: var(--muted); font-size: 0.95rem; }
```

- [ ] **Step 4: Create `src/components/manifesto/Manifesto.tsx`**

```tsx
import './manifesto.css';

const REFUSALS: Array<[string, string]> = [
  ['We don’t bill hours', 'Every engagement is a fixed scope with a fixed quote, agreed before work starts. The meter never runs.'],
  ['We don’t ship unreviewed agent output', 'Agents build fast; humans decide what leaves. Every stage of the line ends at a human gate.'],
  ['We don’t grade our own homework', 'The Zha Standard is public. Check anything we ship against it — that’s what it’s for.'],
  ['We don’t do open-ended engagements', 'No retainers that drift, no phase twos that never end. A scope closes, the metal ships.'],
];

export function Manifesto() {
  return (
    <section className="section" aria-labelledby="manifesto-heading">
      <div className="container">
        <p className="eyebrow">Positions</p>
        <h2 id="manifesto-heading">What we don&apos;t do</h2>
        <div className="manifesto-grid">
          {REFUSALS.map(([title, body]) => (
            <article key={title} className="refusal" data-reveal>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `src/components/standard/standard.css`**

```css
.standard-wrap { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 40px; align-items: start; margin-top: 40px; }
@media (max-width: 760px) { .standard-wrap { grid-template-columns: 1fr; } }
.standard-seal { width: 120px; height: 120px; }
.standard-groups { display: grid; gap: 26px; }
.standard-group h3 {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--copper); margin-bottom: 10px;
}
.standard-group ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; color: var(--muted); font-size: 0.95rem; }
.standard-group li::before { content: '□ '; color: var(--faint); }
.standard-version {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--faint); margin-top: 28px;
}
```

- [ ] **Step 6: Create `src/components/standard/ZhaStandard.tsx`**

```tsx
import { SealHexZ } from '../marks/Marks';
import './standard.css';

const GROUPS: Array<[string, string[]]> = [
  ['Security', ['No secrets in source or client bundles', 'Auth on every route, row-level security on every table', 'User input validated at every boundary']],
  ['Tests', ['Behavioral coverage on every money and data path', 'Tests run in CI on every change', 'Failures block deploys, not weekends']],
  ['Infrastructure', ['Reproducible builds, one-command deploys', 'Rollback plan that has actually been tested', 'Health checks and alerting wired before launch']],
  ['Cost', ['Token budget known per feature, tracked in production', 'Model routing: cheap models for cheap work', 'Caching before scale, not after the bill']],
  ['Provenance', ['Every module attributable: which agent built it, which human approved it', 'Dependency manifest reviewed and pinned', 'Handover docs a stranger could operate from']],
];

export function ZhaStandard() {
  return (
    <section className="section" id="standard" aria-labelledby="standard-heading">
      <div className="container">
        <p className="eyebrow">The Zha Standard</p>
        <h2 id="standard-heading">Our definition of production-ready, in public.</h2>
        <p className="section-sub">
          Every project leaves the foundry checked against this list — and you can check it too.
          That&apos;s the point of publishing it.
        </p>
        <div className="standard-wrap">
          <div className="standard-groups" data-reveal>
            {GROUPS.map(([name, items]) => (
              <div className="standard-group" key={name}>
                <h3>{name}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="standard-version">Zha Standard v0.1 — expands as the foundry learns</p>
          </div>
          <SealHexZ className="standard-seal" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create `src/components/teardowns/teardowns.css`**

```css
.teardown-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 40px; }
@media (max-width: 860px) { .teardown-grid { grid-template-columns: 1fr; } }
.teardown { border: 1px dashed var(--line); padding: 30px 26px; min-height: 180px; display: flex; flex-direction: column; justify-content: space-between; }
.teardown-no {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--faint);
}
.teardown-state { font-weight: 800; font-size: 1.1rem; color: var(--steel); }
```

- [ ] **Step 8: Create `src/components/teardowns/Teardowns.tsx`**

```tsx
import './teardowns.css';

export function Teardowns() {
  return (
    <section className="section" id="teardowns" aria-labelledby="teardowns-heading">
      <div className="container">
        <p className="eyebrow">Teardowns</p>
        <h2 id="teardowns-heading">Every rescue gets published.</h2>
        <p className="section-sub">
          Before, after, and what it took — real repos, real failures, real fixes. The first
          castings are on the floor now.
        </p>
        <div className="teardown-grid">
          {['Nº 001', 'Nº 002', 'Nº 003'].map((n) => (
            <article className="teardown" key={n} data-reveal>
              <p className="teardown-no">Teardown {n}</p>
              <p className="teardown-state">In the crucible</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Mount in `src/app/page.tsx`** (after `<FoundryCare />`, order: `<ProcessLine />`, `<Manifesto />`, `<ZhaStandard />`, `<Teardowns />`), run `npm run build`.
Expected: compiles.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: process line, manifesto, zha standard, teardown slots"
```

---

### Task 8: Contact section + footer

**Files:**
- Create: `src/components/contact/ContactSection.tsx`, `src/components/contact/ContactForm.tsx`, `src/components/contact/contact.css`
- Create: `src/components/footer/SiteFooter.tsx`, `src/components/footer/footer.css`

**Interfaces:**
- Consumes: `submitLead`, `LeadState` from Task 3; `SteppedZ` from Task 4.
- Produces: `<ContactSection />` (`#contact`), `<SiteFooter />`. Composed by Task 9.

- [ ] **Step 1: Create `src/components/contact/contact.css`**

```css
.contact-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 48px; margin-top: 40px; }
@media (max-width: 860px) { .contact-grid { grid-template-columns: 1fr; } }
.contact-pitch { color: var(--muted); max-width: 46ch; }
.contact-pitch strong { color: var(--text); font-weight: 500; }
.contact-form { display: grid; gap: 14px; }
.contact-form .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 560px) { .contact-form .row { grid-template-columns: 1fr; } }
.contact-form textarea { min-height: 140px; resize: vertical; }
.contact-form label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
```

- [ ] **Step 2: Create `src/components/contact/ContactForm.tsx`** (client)

```tsx
'use client';

import { useActionState } from 'react';
import { submitLead, type LeadState } from '../../app/actions';

const initial: LeadState = { status: 'idle', message: '' };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitLead, initial);

  return (
    <form className="contact-form" action={action}>
      <input type="hidden" name="kind" value="contact" />
      <div className="row">
        <div>
          <label htmlFor="c-name">Name</label>
          <input id="c-name" name="name" className="field" placeholder="Name" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" className="field" placeholder="Email" autoComplete="email" />
        </div>
      </div>
      <div>
        <label htmlFor="c-link">Project link</label>
        <input id="c-link" name="link" className="field" placeholder="Project link — GitHub, Replit, Lovable (optional for ideas)" />
      </div>
      <div>
        <label htmlFor="c-message">Message</label>
        <textarea id="c-message" name="message" className="field" placeholder="What are we casting or forging?" />
      </div>
      <div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send it to the foundry'}
        </button>
      </div>
      {state.status !== 'idle' && (
        <p className="form-status" data-status={state.status} role="status">{state.message}</p>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Create `src/components/contact/ContactSection.tsx`**

```tsx
import { ContactForm } from './ContactForm';
import './contact.css';

export function ContactSection() {
  return (
    <section className="section" id="contact" aria-labelledby="contact-heading">
      <div className="container">
        <p className="eyebrow">Final pour</p>
        <h2 id="contact-heading">Stop wrestling with prompt limits.</h2>
        <div className="contact-grid">
          <p className="contact-pitch">
            Let&apos;s turn your vibe into structural steel. Send a repo, a broken deploy, or three
            sentences about an idea — <strong>a human reads every message and replies within one
            working day.</strong>
          </p>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `src/components/footer/footer.css`**

```css
.footer { border-top: 1px solid var(--line); padding-block: 48px; }
.footer-inner { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; align-items: flex-start; }
.footer-lockup { display: flex; align-items: center; gap: 10px; }
.footer-lockup svg { width: 24px; height: 24px; }
.footer-lockup span { font-weight: 800; font-size: 12.5px; letter-spacing: 0.18em; }
.footer-lockup em { font-style: normal; color: var(--copper); }
.footer-note { color: var(--faint); font-size: 0.88rem; max-width: 46ch; margin-top: 14px; }
.footer-links { display: grid; gap: 8px; font-family: var(--font-plex-mono), ui-monospace, monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
.footer-links a { color: var(--muted); text-decoration: none; }
.footer-links a:hover { color: var(--copper); }
.footer-legal { width: 100%; margin-top: 32px; color: var(--faint); font-size: 0.8rem; font-family: var(--font-plex-mono), ui-monospace, monospace; letter-spacing: 0.08em; }
```

- [ ] **Step 5: Create `src/components/footer/SiteFooter.tsx`**

```tsx
import { SteppedZ } from '../marks/Marks';
import './footer.css';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <p className="footer-lockup">
            <SteppedZ />
            <span>THE <em>ZHA</em> FOUNDRY</span>
          </p>
          <p className="footer-note">
            An independent software foundry, built and run in public by a founder who signs his
            name on every shipment.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <a href="#assay">Run an assay</a>
          <a href="#standard">The Zha Standard</a>
          <a href="mailto:kanthaiyee@gmail.com">kanthaiyee@gmail.com</a>
        </nav>
        <p className="footer-legal">© 2026 The Zha Foundry · Forged, not generated.</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Run `npm run build`**
Expected: compiles.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: contact section and footer"
```

---

### Task 9: Page composition + pour seam + motion layer

**Files:**
- Create: `src/components/motion/ForgeMotion.tsx`
- Create: `src/components/seam/PourSeam.tsx`, `src/components/seam/seam.css`
- Modify: `src/app/page.tsx` (final composition)

**Interfaces:**
- Consumes: every section component from Tasks 5–8.
- Produces: the finished page. Motion contract: `[data-seam]` scaleY 0→1 scrubbed over full page; `[data-ignite]` gains class `lit` at 70% viewport; `[data-reveal]` slides up 24px + fades at 82% viewport.

- [ ] **Step 1: Create `src/components/seam/seam.css`**

```css
.seam {
  position: fixed; top: 0; bottom: 0; left: max(12px, calc((100vw - var(--container)) / 2 - 40px));
  width: 2px; z-index: 5; pointer-events: none;
  background: linear-gradient(to bottom, var(--hot), var(--copper) 55%, var(--deep));
  transform: scaleY(0); transform-origin: top;
  opacity: 0.85;
}
@media (max-width: 1240px) { .seam { display: none; } }
@media (prefers-reduced-motion: reduce) { .seam { transform: none; opacity: 0.3; } }
```

- [ ] **Step 2: Create `src/components/seam/PourSeam.tsx`**

```tsx
import './seam.css';

export function PourSeam() {
  return <div className="seam" data-seam aria-hidden="true" />;
}
```

- [ ] **Step 3: Create `src/components/motion/ForgeMotion.tsx`**

```tsx
'use client';

import { useEffect } from 'react';

export function ForgeMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        gsap.to('[data-seam]', {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 0.6 },
        });

        gsap.utils.toArray<HTMLElement>('[data-ignite]').forEach((el) => {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 70%',
            toggleClass: { targets: el, className: 'lit' },
            once: true,
          });
        });

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.fromTo(
            el,
            { y: 24, opacity: 0 },
            {
              y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 82%', once: true },
            },
          );
        });
      });

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
```

- [ ] **Step 4: Final `src/app/page.tsx`**

```tsx
import { SiteNav } from '../components/nav/SiteNav';
import { Hero } from '../components/hero/Hero';
import { TwoDoors } from '../components/doors/TwoDoors';
import { RealityCheck } from '../components/reality/RealityCheck';
import { ForgeTiers } from '../components/tiers/ForgeTiers';
import { FoundryCare } from '../components/care/FoundryCare';
import { ProcessLine } from '../components/process/ProcessLine';
import { Manifesto } from '../components/manifesto/Manifesto';
import { ZhaStandard } from '../components/standard/ZhaStandard';
import { Teardowns } from '../components/teardowns/Teardowns';
import { ContactSection } from '../components/contact/ContactSection';
import { SiteFooter } from '../components/footer/SiteFooter';
import { PourSeam } from '../components/seam/PourSeam';
import { ForgeMotion } from '../components/motion/ForgeMotion';

export default function Home() {
  return (
    <>
      <SiteNav />
      <PourSeam />
      <main id="top">
        <Hero />
        <TwoDoors />
        <RealityCheck />
        <ForgeTiers />
        <FoundryCare />
        <ProcessLine />
        <Manifesto />
        <ZhaStandard />
        <Teardowns />
        <ContactSection />
      </main>
      <SiteFooter />
      <ForgeMotion />
    </>
  );
}
```

- [ ] **Step 5: Run `npm run build` and check bundle size**

Run: `npm run build`
Expected: compiles; first-load JS for `/` under 150 kb (GSAP is not in first load — it's a dynamic chunk).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: compose page with pour seam and scroll motion"
```

---

### Task 10: E2E smoke + screenshots + final verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/landing.spec.ts`
- Modify: `.gitignore` (add `/test-results/`, `/screenshots/`)

**Interfaces:**
- Consumes: the running site (`npm run dev` via Playwright webServer).

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true },
});
```

- [ ] **Step 2: Install the browser**

```bash
npx playwright install chromium
```

- [ ] **Step 3: Write `tests/e2e/landing.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('hero loads with headline and assay form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('We forge it.');
  await expect(page.getByPlaceholder('github.com/you/your-app')).toBeVisible();
});

test('assay form validates and submits', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('github.com/you/your-app').fill('github.com/acme/app');
  await page.getByPlaceholder('you@company.com').fill('bad-email');
  await page.getByRole('button', { name: 'Run the assay' }).click();
  await expect(page.getByRole('status')).toContainText(/email/i);

  await page.getByPlaceholder('you@company.com').fill('a@b.co');
  await page.getByRole('button', { name: 'Run the assay' }).click();
  await expect(page.getByRole('status')).toContainText(/48 hours/);
});

test('contact form submits', async ({ page }) => {
  await page.goto('/#contact');
  await page.getByPlaceholder('Name').fill('Prem');
  await page.getByPlaceholder('Email').fill('a@b.co');
  await page.getByPlaceholder('What are we casting or forging?').fill('An idea.');
  await page.getByRole('button', { name: 'Send it to the foundry' }).click();
  await expect(page.getByRole('status').last()).toContainText(/human/i);
});

test('all nav anchors resolve to sections', async ({ page }) => {
  await page.goto('/');
  for (const id of ['cast', 'forge', 'care', 'standard', 'teardowns', 'contact', 'process', 'assay']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

test('no horizontal overflow at key breakpoints', async ({ page }) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, `overflow at ${width}px`).toBe(false);
  }
});

test('screenshots at key breakpoints', async ({ page }) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `screenshots/landing-${width}.png`, fullPage: true });
  }
});
```

- [ ] **Step 4: Run E2E**

Run: `npm run test:e2e`
Expected: 6 passed; screenshots written to `screenshots/`.

- [ ] **Step 5: Review screenshots visually** (Read `screenshots/landing-320.png`, `-768.png`, `-1440.png`)

Check against spec: hierarchy, spacing rhythm, copper-as-heat not flat accent, table legibility, no template smell. Fix anything that reads wrong before proceeding — this is the design gate, treat it as a real review, iterate until the page would survive the "does this look vibe-coded?" question.

- [ ] **Step 6: Reduced-motion + keyboard pass**

Run dev server; in a Playwright snippet or manually verify: with `prefers-reduced-motion: reduce` emulated, page renders fully visible with no animation; tab order reaches assay input, all nav links, both forms; focus rings visible.

- [ ] **Step 7: Add to `.gitignore`**

```
/test-results/
/screenshots/
```

- [ ] **Step 8: Full verification**

```bash
npm test && npm run test:e2e && npm run build
```

Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "test: e2e smoke, breakpoint overflow checks, screenshots"
```

---

## Self-Review Notes

- **Spec coverage:** All 12 spec sections have tasks (nav T5, hero+assay T5, doors T6, reality T6, tiers T6, care T6, process T7, manifesto T7, standard T7, teardowns T7, contact T8, footer T8); identity marks T4; motion + seam T9; verification gates T10. No prices appear anywhere; no fake proof; ladder story absent from copy (footer says only "Forged, not generated").
- **Deferred by spec (out of scope):** real assay pipeline, payments, teardown detail pages, light theme.
- **Type consistency:** `LeadState`/`submitLead` signatures match across Tasks 3, 5, 8; mark component names match across Tasks 4–9; `data-seam`/`data-ignite`/`data-reveal` attributes match between section tasks and Task 9's motion contract.
