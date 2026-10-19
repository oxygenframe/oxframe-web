import { expect, test } from '@playwright/test';
import { href, pages } from '../src/lib/docs';

// Every page in the docs list exists, has a title, and its "Next" link leads
// to the following page; internal links on it point to pages that exist.
test('docs pages and links', async ({ page, request }) => {
  const checked = new Set<string>();
  for (const [i, p] of pages.entries()) {
    const url = href(p.slug);
    const res = await page.goto(url);
    expect(res?.status(), url).toBe(200);
    await expect(page.locator('main h1, article h1').first(), url).toBeVisible();

    const next = pages[i + 1];
    if (next) {
      await expect(page.locator(`a[href="${href(next.slug)}"]`).last(), url).toBeVisible();
    }

    const links = await page
      .locator('a[href^="/"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')!.split('#')[0]!));
    for (const link of links) {
      if (checked.has(link)) continue;
      checked.add(link);
      const r = await request.get(link);
      expect(r.status(), `${url} → ${link}`).toBe(200);
    }
  }
});

test('robots.txt, sitemap.xml and llms.txt are served', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://oxframe.dev/sitemap.xml');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const p of pages) expect(sitemap).toContain(`<loc>https://oxframe.dev${href(p.slug)}</loc>`);
  expect(await (await request.get('/llms.txt')).text()).toContain('llms-full.txt');
  expect(await (await request.get('/llms-full.txt')).text()).toContain('### learn_01_hello');
});
