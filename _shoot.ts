import { chromium } from '@playwright/test';

const OUT = process.env.OUT ?? '/tmp/shots';
const THEMES = ['dark', 'light'] as const;
const WIDTHS = [320, 768, 1440] as const;

// section anchors to capture after scrolling the whole page (so scroll-triggered
// states have fired)
const SECTIONS = ['#cast', '.reality-table', '.tiers-grid', '#care', '#process', '.manifesto-grid', '#standard', '#teardowns', '#contact', 'footer'];

async function main() {
  const browser = await chromium.launch();
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        colorScheme: theme === 'dark' ? 'dark' : 'light',
      });
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('zha-theme', t);
        } catch {}
      }, theme);
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${OUT}/${theme}-${width}-hero.png` });

      // crawl down so every ScrollTrigger fires
      await page.evaluate(async () => {
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
      });
      await page.waitForTimeout(800);

      if (width === 1440) {
        for (const sel of SECTIONS) {
          const el = page.locator(sel).first();
          try {
            await el.scrollIntoViewIfNeeded();
            await page.waitForTimeout(650);
            const name = sel.replace(/[#.]/g, '');
            await page.screenshot({ path: `${OUT}/${theme}-${width}-${name}.png` });
          } catch {
            // selector missing — recorded by absence of the file
          }
        }
      } else {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(800);
        await page.screenshot({ path: `${OUT}/${theme}-${width}-bottom.png` });
      }
      await page.close();
    }
  }
  await browser.close();
}

main();
