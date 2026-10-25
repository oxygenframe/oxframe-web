import { expect, test } from '@playwright/test';

test('<oxframe-player> plays an example and stops at the end', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/docs/embed');
  const player = page.getByTestId('embed-demo');
  await expect
    .poll(() => player.evaluate((e: HTMLElement & { duration: number }) => e.duration), {
      timeout: 120_000,
    })
    .toBeGreaterThan(0);
  // The demo loops; without `loop` it stops on the last frame and says so.
  await player.evaluate((e: HTMLElement & { play(): void }) => {
    e.removeAttribute('loop');
    (window as unknown as { ended: boolean }).ended = false;
    e.addEventListener('ended', () => ((window as unknown as { ended: boolean }).ended = true));
    e.play();
  });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { ended: boolean }).ended), {
      timeout: 30_000,
    })
    .toBe(true);
  await expect
    .poll(() => player.evaluate((e: HTMLElement & { paused: boolean }) => e.paused))
    .toBe(true);
  // Something was drawn: the canvas has the scene's size.
  const width = await player.evaluate((e) => e.shadowRoot!.querySelector('canvas')!.width);
  expect(width).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test('the playground copies an embed snippet for the current build', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/playground?ex=intro');
  await expect(page.getByTestId('compile-status')).toHaveText(/Compiled/, { timeout: 300_000 });
  await page.getByTestId('embed').click();
  await expect(page.getByTestId('embed')).toHaveText('Embed copied');
  const snippet = await page.evaluate(() => navigator.clipboard.readText());
  expect(snippet).toMatch(/<script type="module" src="http:\/\/127\.0\.0\.1:4173\/player\.js">/);
  expect(snippet).toMatch(/<oxframe-player build="[0-9a-f]{32}" compile="[^"]+" controls loop>/);
});

test('the 404 page plays its scene and helps find the page', async ({ page }) => {
  const res = await page.goto('/docs/renderng');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  // The scene (lib/examples/not_found.rs), rendered to a short loop.
  const video = page.locator('video.scene');
  await expect(video).toBeVisible();
  const res2 = await page.request.get((await video.getAttribute('src'))!);
  expect(res2.status()).toBe(200);
  await expect(page.getByTestId('docs-search')).toHaveValue('renderng');
  await expect(page.locator('.mean a').first()).toHaveAttribute('href', '/docs/rendering');
  // Results are listed in the page; one click opens the docs page.
  const hit = page.getByTestId('search-results').locator('a').first();
  await expect(hit).toBeVisible();
  await hit.click();
  await expect(page).toHaveURL(/\/docs\/rendering/);
});
