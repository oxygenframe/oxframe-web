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

// SEO guard: every page in the sitemap ships, in its prerendered HTML (what
// crawlers and link previews read, before any JS), a unique title and
// description, a canonical URL pointing at itself, social cards and a single h1.
test('every sitemap page has complete, unique SEO metadata', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  expect(urls.length).toBeGreaterThan(20);
  const attr = (html: string, re: RegExp) => re.exec(html)?.[1];
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const url of urls) {
    const path = new URL(url).pathname;
    const html = await (await request.get(path)).text();
    const title = attr(html, /<title>([^<]*)<\/title>/);
    const description = attr(html, /<meta name="description" content="([^"]*)"/);
    expect(title, path).toBeTruthy();
    expect(title!.length, `${path} title length`).toBeLessThanOrEqual(65);
    expect(description, path).toBeTruthy();
    expect(description!.length, `${path} description length`).toBeGreaterThanOrEqual(70);
    expect(description!.length, `${path} description length`).toBeLessThanOrEqual(170);
    expect(attr(html, /<link rel="canonical" href="([^"]*)"/), path).toBe(url);
    expect(attr(html, /<meta property="og:url" content="([^"]*)"/), path).toBe(url);
    expect(html, path).toContain('<meta property="og:image" content="https://oxframe.dev/og.png"');
    expect(html, path).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(html.match(/<h1[\s>]/g)?.length, `${path} h1 count`).toBe(1);
    expect(html, path).not.toContain('name="robots" content="noindex"');
    expect(titles.get(title!), `duplicate title on ${path}`).toBeUndefined();
    expect(descriptions.get(description!), `duplicate description on ${path}`).toBeUndefined();
    titles.set(title!, path);
    descriptions.set(description!, path);
    for (const m of html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g))
      expect(() => JSON.parse(m[1]!), `${path} JSON-LD`).not.toThrow();
  }
  expect((await request.get('/og.png')).headers()['content-type']).toBe('image/png');
});
