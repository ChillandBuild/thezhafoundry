import { expect, test } from '@playwright/test';

test('hero loads with headline and assay form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('We forge it.');
  await expect(page.getByPlaceholder('github.com/you/your-app')).toBeVisible();
});

test('assay form validates and submits', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('github.com/you/your-app').fill('github.com/acme/app');
  // Note: "bad-email" fails the input's native type="email" constraint validation
  // (no "@"), which blocks form submission before the server action ever runs —
  // see task-10-report.md for details. "a@b" passes native validation but fails
  // the server's stricter Zod email check, so it actually reaches the friendly
  // server-rendered error this test is meant to verify.
  await page.getByPlaceholder('you@company.com').fill('a@b');
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

test('reduced motion renders fully visible; keyboard reaches assay form in order', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const revealOpacities = await page.locator('[data-reveal]').evaluateAll((elements) =>
    elements.map((element) => Number(getComputedStyle(element).opacity)),
  );
  expect(revealOpacities.length).toBeGreaterThan(0);
  for (const opacity of revealOpacities) {
    expect(opacity).toBeGreaterThan(0);
  }

  const assayLink = page.locator('#assay-link');
  let reachedAssayLink = false;
  for (let tabPress = 0; tabPress < 20; tabPress += 1) {
    await page.keyboard.press('Tab');
    reachedAssayLink = await assayLink.evaluate((element) => element === document.activeElement);
    if (reachedAssayLink) break;
  }
  expect(reachedAssayLink).toBe(true);
  await expect(assayLink).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByPlaceholder('you@company.com')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Run the assay' })).toBeFocused();
});
