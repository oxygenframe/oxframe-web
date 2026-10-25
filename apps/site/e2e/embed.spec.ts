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
