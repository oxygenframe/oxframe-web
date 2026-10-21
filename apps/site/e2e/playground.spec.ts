import { expect, test } from '@playwright/test';

const frameOf = (page: import('@playwright/test').Page) =>
  page.locator('[data-testid=viewport] canvas').getAttribute('data-frame').then(Number);

test('code typed on the site renders in the browser', async ({ page }) => {
  await page.goto('/playground?ex=intro');
  await expect(page.getByTestId('compile-status')).toHaveText(/Compiled/, { timeout: 300_000 });
  await expect.poll(() => frameOf(page), { timeout: 15_000 }).toBeGreaterThanOrEqual(0);
  // Spec §8: first frame ≤ 1 s after the wasm arrives.
  const firstFrame = Number(await page.getByTestId('first-frame').innerText());
  expect(firstFrame).toBeLessThan(1000);

  // Scrub with the keyboard: the engine in the worker answers.
  await page.locator('[data-testid=viewport]').click();
  await page.keyboard.press('End');
  await expect.poll(() => frameOf(page)).toBeGreaterThan(30);
});

test('compiler errors are listed with their line', async ({ page }) => {
  await page.goto('/playground?ex=intro');
  await expect(page.getByTestId('compile-status')).toHaveText(/Compiled/, { timeout: 300_000 });
  await page.locator('.monaco-editor').click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type(`\nfn broken_${Date.now()}() { oops }\n`);
  await expect(page.getByTestId('compile-errors')).toContainText('cannot find value `oops`', {
    timeout: 120_000,
  });
  await expect(page.getByTestId('compile-errors')).toContainText(/scene\.rs:\d+:\d+/);
});

test('share links restore the code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/playground?ex=morph');
  await expect(page.getByTestId('compile-status')).toHaveText(/Compiled/, { timeout: 300_000 });
  await page.getByRole('button', { name: /Share/ }).click();
  // Under a full e2e run the link can take longer than the default 5 s.
  await expect
    .poll(() => page.evaluate(() => location.hash), { timeout: 15_000 })
    .toContain('code=');
  const url = page.url();
  const fresh = await context.newPage();
  await fresh.goto(url);
  await expect(fresh.locator('.monaco-editor')).toContainText('STAR', { timeout: 30_000 });
});

test('guide lessons embed live examples', async ({ page }) => {
  // Built on demand if the service has not prebuilt it yet.
  await page.goto('/docs/guide/hello');
  await expect.poll(() => frameOf(page), { timeout: 300_000 }).toBeGreaterThanOrEqual(0);
});

test('gallery links open examples', async ({ page }) => {
  await page.goto('/gallery');
  await page
    .getByRole('link', { name: /Open in playground/ })
    .first()
    .click();
  await expect(page).toHaveURL(/playground\?ex=/);
});

test('exports mp4 in the browser with WebCodecs', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'H.264 WebCodecs');
  await page.goto('/playground?ex=intro');
  await expect(page.getByTestId('compile-status')).toHaveText(/Compiled/, { timeout: 300_000 });
  await expect.poll(() => frameOf(page), { timeout: 15_000 }).toBeGreaterThanOrEqual(0);
  await page.getByTestId('export').click();
  const link = page.getByTestId('download');
  const failed = page.getByTestId('compile-status').filter({ hasText: /WebCodecs|not supported/ });
  await expect(link.or(failed)).toBeVisible({ timeout: 120_000 });
  if (await failed.isVisible()) test.skip(true, 'no H.264 encoder in this browser build');
  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  expect(download.suggestedFilename()).toBe('intro.mp4');
  // A real MP4: `ftyp` first, a `moov` index, and frame data in `mdat`.
  const { readFileSync } = await import('node:fs');
  const mp4 = readFileSync((await download.path())!);
  expect(mp4.toString('latin1', 4, 8)).toBe('ftyp');
  expect(mp4.includes('moov')).toBe(true);
  expect(mp4.includes('mdat')).toBe(true);
  expect(mp4.length).toBeGreaterThan(2_000);
});

test('reports which renderer the engine uses', async ({ page }) => {
  await page.goto('/playground?ex=effects');
  await expect(page.getByTestId('compile-status')).toHaveText(/Compiled/, { timeout: 300_000 });
  await expect.poll(() => frameOf(page), { timeout: 30_000 }).toBeGreaterThanOrEqual(0);
  await expect(page.getByTestId('renderer')).toHaveAttribute('data-renderer', /^(gpu|cpu)$/);
});

test('the quicksort showcase compiles and plays', async ({ page }) => {
  await page.goto('/playground?ex=quicksort');
  await expect(page.getByTestId('compile-status')).toHaveText(/Compiled/, { timeout: 300_000 });
  await expect.poll(() => frameOf(page), { timeout: 30_000 }).toBeGreaterThanOrEqual(0);
  await page.locator('[data-testid=viewport]').click();
  await page.keyboard.press('End');
  await expect.poll(() => frameOf(page), { timeout: 30_000 }).toBeGreaterThan(2000);
  // Tunables from tune!() appear in the inspector.
  await expect(page.getByTestId('tunable-bars')).toBeVisible();
});

// Shader presets run inside the wasm engine. 0.11.0 shipped a waves example
// that panicked there ("unreachable executed"), so each one plays to its end.
for (const ex of [
  'waves',
  'splash',
  'ocean',
  'charts',
  'gauge',
  'architecture',
  'matrix_multiply',
  'cube_3d',
]) {
  test(`the ${ex} example plays to the last frame in the browser`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.goto(`/playground?ex=${ex}`);
    // An unknown name falls back to intro, which would pass for the wrong reason.
    await expect(page.getByTestId('example')).toHaveValue(ex);
    await expect(page.getByTestId('compile-status')).toHaveText(/Compiled/, { timeout: 300_000 });
    await expect.poll(() => frameOf(page), { timeout: 30_000 }).toBeGreaterThanOrEqual(0);
    await page.locator('[data-testid=viewport]').click();
    await page.keyboard.press('End');
    await expect.poll(() => frameOf(page), { timeout: 30_000 }).toBeGreaterThan(30);
    expect(errors.filter((e) => /unreachable|panicked/i.test(e))).toEqual([]);
  });
}
