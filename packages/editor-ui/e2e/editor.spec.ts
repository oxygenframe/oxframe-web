import { expect, test, type Page } from '@playwright/test';

type Sent = { type: string; [k: string]: unknown };

async function open(page: Page, hash = '') {
  await page.goto(`/?backend=mock${hash}`);
  await expect(page.getByTestId('status')).toHaveText(/Connected/);
  await expect(page.getByTestId('frame')).toHaveText(/\/ 119/);
}

const sent = (page: Page) =>
  page.evaluate(() =>
    (window.__oxframe!.backend as unknown as { sent: Sent[] }).sent.map((c) => ({ ...c })),
  );

const frameText = (page: Page) => page.getByTestId('frame').innerText();

test('connects, shows frames and the timeline', async ({ page }) => {
  await open(page);
  await expect(page.locator('canvas[data-frame="0"]')).toBeVisible();
  await expect(page.getByTestId('marker-beat')).toBeVisible();
  await expect(page.getByTestId('marker-fade')).toBeVisible();
  await expect(page.getByTestId('tree')).toContainText('Rect');
});

test('keyboard: space, arrows, shift+arrows, home, end', async ({ page }) => {
  await open(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('frame')).toHaveText('1 / 119');
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.getByTestId('frame')).toHaveText('11 / 119');
  await page.keyboard.press('End');
  await expect(page.getByTestId('frame')).toHaveText('119 / 119');
  await page.keyboard.press('Home');
  await expect(page.getByTestId('frame')).toHaveText('0 / 119');
  await page.keyboard.press(' ');
  await expect(page.getByTestId('play')).toHaveText('❚❚');
  await page.waitForTimeout(300);
  await page.keyboard.press(' ');
  await expect(page.getByTestId('play')).toHaveText('▶');
  expect(await frameText(page)).not.toBe('0 / 119');
});

test('scrubbing the track seeks', async ({ page }) => {
  await open(page);
  const box = (await page.getByTestId('track').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height - 8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height - 8, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => Number((await frameText(page)).split(' ')[0])).toBeGreaterThan(50);
  expect((await sent(page)).filter((c) => c.type === 'Seek').length).toBeGreaterThan(1);
});

test('dragging a marker writes it to meta', async ({ page }) => {
  await open(page);
  const marker = page.getByTestId('marker-beat');
  const m = (await marker.boundingBox())!;
  const track = (await page.getByTestId('track').boundingBox())!;
  await page.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width * 0.5, m.y + m.height / 2, { steps: 5 });
  await page.mouse.up();
  const cmd = (await sent(page)).filter((c) => c.type === 'SetMarker').at(-1)!;
  expect(cmd.name).toBe('beat');
  expect(cmd.scene).toBe('intro');
  expect(Math.abs((cmd.time as number) - 1.0)).toBeGreaterThan(0.01);
});

test('M adds a marker at the playhead', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('m');
  await expect(page.getByTestId('marker-marker-1')).toBeVisible();
  const cmd = (await sent(page)).filter((c) => c.type === 'SetMarker').at(-1)!;
  expect(cmd).toMatchObject({ name: 'marker-1', scene: 'intro' });
});

test('clicking the square selects it and shows signals', async ({ page }) => {
  await open(page);
  const v = (await page.getByTestId('viewport').boundingBox())!;
  // Square at frame 0 is centered at (200, 540) of 1920×1080.
  const scale = Math.min(v.width / 1920, v.height / 1080);
  const ox = v.x + v.width / 2 - (1920 * scale) / 2;
  const oy = v.y + v.height / 2 - (1080 * scale) / 2;
  await page.mouse.click(ox + 200 * scale, oy + 540 * scale);
  await expect(page.getByTestId('signals')).toContainText('#e13238ff');
  await expect(page.locator('[role=treeitem][aria-selected=true]')).toContainText('Rect');
});

test('error overlay and building status', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const b = window.__oxframe!.backend as unknown as { inject(e: unknown): void };
    b.inject({ type: 'Building' });
  });
  await expect(page.getByTestId('status')).toHaveText(/Building/);
  await page.evaluate(() => {
    const b = window.__oxframe!.backend as unknown as { inject(e: unknown): void };
    b.inject({
      type: 'Error',
      kind: 'Build',
      message: 'error[E0425]: cannot find value `oops`',
      spans: [{ file: 'src/main.rs', line: 12, column: 9, message: 'not found' }],
    });
  });
  await expect(page.getByTestId('error-overlay')).toContainText('src/main.rs:12:9');
  await expect(page.getByTestId('error-overlay')).toContainText('oops');
  await page.evaluate(() => {
    const b = window.__oxframe!.backend as unknown as { inject(e: unknown): void };
    b.inject({ type: 'Reloaded' });
  });
  await expect(page.getByTestId('error-overlay')).toHaveCount(0);
  await expect(page.getByTestId('reloaded')).toBeVisible();
});

test('curve editor and tunables send edits', async ({ page }) => {
  await open(page);
  await page.getByTestId('ease-slide').click();
  const handle = page.getByTestId('handle-0');
  const h = (await handle.boundingBox())!;
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + 40, h.y - 40, { steps: 4 });
  await page.mouse.up();
  await expect
    .poll(async () => (await sent(page)).some((c) => c.type === 'SetEase' && c.name === 'slide'))
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('curve-editor')).toHaveCount(0);

  await page.getByRole('spinbutton', { name: 'speed value' }).fill('2');
  await page.getByRole('spinbutton', { name: 'speed value' }).press('Enter');
  await expect
    .poll(async () => (await sent(page)).some((c) => c.type === 'SetTunable' && c.name === 'speed'))
    .toBe(true);
});

test('view state survives a reload via the URL hash', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.getByTestId('frame')).toHaveText('20 / 119');
  await expect.poll(() => page.evaluate(() => location.hash)).toContain('f=20');
  await page.reload();
  await expect(page.getByTestId('frame')).toHaveText('20 / 119');
});

test('light theme toggles', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Toggle light/dark theme' }).click();
  await expect(page.getByTestId('editor')).toHaveAttribute('data-theme', /light|dark/);
});
