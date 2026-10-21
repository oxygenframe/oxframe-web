import { expect, test } from '@playwright/test';

const frame = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__oxframe!.editor.frame);

test('present: next plays to each stop, back returns, notes follow', async ({ page, context }) => {
  await page.goto('/?backend=mock&present');
  await expect(page.getByTestId('present')).toBeVisible();
  await expect(page.getByTestId('present-counter')).toHaveText('0 / 3');
  // The editor chrome is not there.
  await expect(page.getByTestId('editor')).toHaveCount(0);

  const notes = await context.newPage();
  await notes.goto('/?backend=mock&present=notes');
  await expect(notes.getByTestId('present-notes-counter')).toHaveText('Stop 0 of 3');
  await expect(notes.getByTestId('present-notes-now')).toHaveText('Say hello.');

  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('present-counter')).toHaveText('1 / 3');
  await expect.poll(() => frame(page), { timeout: 5000 }).toBe(30);
  // It stays at the stop.
  await page.waitForTimeout(300);
  expect(await frame(page)).toBe(30);
  await expect(notes.getByTestId('present-notes-now')).toHaveText('The square moves.');

  // Next while playing lands on the stop at once.
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  await expect.poll(() => frame(page)).toBe(59);

  // The notes window drives the presentation too.
  await notes.keyboard.press('ArrowLeft');
  await expect.poll(() => frame(page)).toBe(30);
  await expect(page.getByTestId('present-counter')).toHaveText('1 / 3');
  await page.keyboard.press('Home');
  await expect.poll(() => frame(page)).toBe(0);
});
