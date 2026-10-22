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

// Search results show a favicon only from a square raster icon, and a site
// name and logo from Organization and WebSite JSON-LD on the home page.
test('the site has a logo for search results', async ({ request }) => {
  const html = await (await request.get('/')).text();
  for (const icon of [
    '/favicon.ico',
    '/favicon-96.png',
    '/favicon-192.png',
    '/apple-touch-icon.png',
  ]) {
    expect(html).toContain(`href="${icon}"`);
  }
  for (const [path, type] of [
    ['/favicon.ico', 'image/'],
    ['/favicon-48.png', 'image/png'],
    ['/favicon-96.png', 'image/png'],
    ['/logo-512.png', 'image/png'],
    ['/site.webmanifest', ''],
  ]) {
    const res = await request.get(path!);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type'], path).toContain(type!);
  }
  const graph = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(
    (m) => JSON.parse(m[1]!),
  );
  const org = graph.find((d) => d['@type'] === 'Organization');
  expect(org?.name).toBe('oxframe');
  expect(org?.logo?.url).toBe('https://oxframe.dev/logo-512.png');
  expect(org?.sameAs).toContain('https://github.com/oxygenframe');
  const site = graph.find((d) => d['@type'] === 'WebSite');
  expect(site?.name).toBe('oxframe');
  expect(site?.publisher?.['@id']).toBe(org?.['@id']);
});

// The page CSP must allow what the layout loads: analytics and the star count.
test('main pages load without a CSP violation', async ({ page }) => {
  const blocked: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy/i.test(m.text())) blocked.push(m.text());
  });
  for (const path of ['/', '/docs', '/gallery', '/playground']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  expect(blocked).toEqual([]);
});

test('docs are versioned: switcher, API reference, versioned URLs', async ({ page, request }) => {
  await page.goto('/docs/guide/hello');
  const select = page.getByTestId('docs-version');
  await expect(select.locator('option').first()).toHaveText(/^\d+\.\d+\.\d+ \(latest\)$/);
  const latest = (await select.locator('option').first().textContent())!.split(' ')[0]!;
  await expect(page.getByTestId('api-reference')).toHaveAttribute(
    'href',
    `https://docs.rs/oxframe/${latest}/oxframe/`,
  );
  await expect(page.getByTestId('old-version')).toHaveCount(0);
  // The current docs also answer at their versioned URL.
  const series = latest.split('.').slice(0, 2).join('.');
  const res = await request.get(`/docs/${series}/guide/hello`, { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers()['location']).toMatch(/\/docs\/guide\/hello$/);
  await page.goto(`/docs/${series}`);
  await expect(page).toHaveURL(/\/docs$/);
  // ...and at their exact version.
  const exact = await request.get(`/docs/${latest}/cli`, { maxRedirects: 0 });
  expect(exact.status()).toBe(301);
  // A series with an exact snapshot, and a version that never got one,
  // land on the nearest docs instead of 404.
  for (const [from, to] of [
    ['/docs/0.15/nodes', '/docs/0.15.0/nodes'],
    ['/docs/0.7.0/camera', '/docs/0.8.0/camera'],
  ]) {
    const r = await request.get(from, { maxRedirects: 0 });
    expect(r.status(), from).toBe(301);
    expect(r.headers()['location'], from).toMatch(new RegExp(`${to}$`));
  }

  // Every older version keeps its snapshot, with a banner pointing to the
  // current docs and a docs.rs link of its own.
  const older = (await select.locator('option').allTextContents()).slice(1);
  expect(older.length).toBeGreaterThan(0);
  for (const label of older) {
    const v = await select.locator('option', { hasText: label }).getAttribute('value');
    await page.goto(`/docs/${v}/guide/hello`);
    await expect(page.getByTestId('old-version'), v!).toContainText(
      `The latest version is ${latest}`,
    );
    await expect(page.getByTestId('api-reference')).toHaveAttribute(
      'href',
      new RegExp(`/oxframe/${label}/`),
    );
  }
});

test('the development status is in the docs and next to the logo elsewhere', async ({ page }) => {
  for (const path of ['/docs', '/docs/guide/hello']) {
    await page.goto(path);
    await expect(page.getByTestId('dev-status'), path).toContainText('API is not stable yet');
  }
  for (const path of ['/', '/playground']) {
    await page.goto(path);
    await expect(page.getByTestId('dev-status'), path).toContainText('pre-1.0');
  }
});

test('the playground says which oxframe it runs and warns about other versions', async ({
  page,
}) => {
  await page.goto('/playground?ex=intro');
  await expect(page.getByTestId('sdk-version')).toHaveText(/^oxframe \d+\.\d+\.\d+$/);
  await expect(page.getByTestId('version-warning')).toHaveCount(0);
  await page.goto('/playground?v=0.0&ex=intro');
  await expect(page.getByTestId('version-warning')).toContainText('oxframe 0.0 docs');
});

// <lastmod> is the day the page's source last changed (scripts/lastmod.ts).
test('every sitemap page has a lastmod date', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]!);
  const today = new Date().toISOString().slice(0, 10);
  for (const entry of entries) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(entry)?.[1];
    const day = /<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/.exec(entry)?.[1];
    expect(day, loc).toBeTruthy();
    expect(day! <= today, `${loc} lastmod ${day}`).toBe(true);
  }
});

// Mobile-friendliness (a ranking signal): no page scrolls sideways on a phone.
test('no page is wider than a phone screen', async ({ browser, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  const page = await browser.newPage({ viewport: { width: 320, height: 720 } });
  const wide: string[] = [];
  for (const path of paths) {
    await page.goto(path);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    if (width > 320) wide.push(`${path}: ${width}px`);
  }
  expect(wide).toEqual([]);
});
