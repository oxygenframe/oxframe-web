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
