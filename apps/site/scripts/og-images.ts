// Renders the link preview card of every page in the sitemap with oxframe
// (the scene in og/), into static/og/<page>.png, and records each card's
// title in src/lib/og.json, which <Seo> reads. Only cards whose title or
// section changed are rendered again. The home page keeps static/og.png.
//
//   bun run build && bun scripts/og-images.ts
//
// Needs cargo. Runs on the built site, so the titles are the ones the pages
// really have; e2e fails while a card is missing or out of date.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Card {
  title: string;
  section: string;
  image: string;
}

/** The label above the title. */
export function sectionOf(path: string): string {
  if (path.startsWith('/docs/guide/')) return 'Guide';
  if (path.startsWith('/docs')) return 'Docs';
  if (path.startsWith('/agents/skills/')) return 'Agent skills';
  if (path.startsWith('/agents')) return 'Agents';
  if (path === '/compare' || path.startsWith('/vs/') || path.startsWith('/alternatives'))
    return 'Compare';
  if (path.startsWith('/use-cases')) return 'Use cases';
  const names: Record<string, string> = {
    '/playground': 'Playground',
    '/gallery': 'Gallery',
    '/use-cases': 'Use cases',
    '/showcase': 'Showcase',
  };
  return names[path] ?? 'oxframe';
}

/** The page title without the site name. */
export const topic = (title: string) => title.replace(/ — oxframe( docs)?$/, '');

/** static/og/<file>.png for a path: /docs/guide/hello → docs-guide-hello. */
export const imageOf = (path: string) => `/og/${path.slice(1).replace(/\//g, '-')}.png`;

if (import.meta.main) {
  // Here, not at the top: e2e imports this module under Node, without import.meta.dir.
  const site = join(import.meta.dir, '..');
  const build = join(site, 'build');
  const manifest = join(site, 'src/lib/og.json');
  const out = join(site, 'static/og');
  const sitemap = readFileSync(join(build, 'sitemap.xml'), 'utf8');
  const paths = [...sitemap.matchAll(/<loc>https:\/\/oxframe\.dev([^<]*)<\/loc>/g)]
    .map((m) => m[1]!)
    // The home page keeps og.png; a gallery page shows its video's poster.
    .filter((p) => p !== '/' && !p.startsWith('/gallery/'));
  const saved: Record<string, Card> = existsSync(manifest)
    ? JSON.parse(readFileSync(manifest, 'utf8'))
    : {};
  const cards: Record<string, Card> = {};
  const todo: string[] = [];
  for (const path of paths) {
    const html = readFileSync(join(build, `${path.slice(1)}.html`), 'utf8');
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
    if (!title) throw new Error(`${path}: no <title>`);
    const card = {
      title: topic(
        title
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&'),
      ),
      section: sectionOf(path),
      image: imageOf(path),
    };
    cards[path] = card;
    const old = saved[path];
    if (
      !old ||
      old.title !== card.title ||
      old.section !== card.section ||
      !existsSync(join(site, 'static', card.image))
    )
      todo.push(path);
  }
  if (todo.length) {
    console.log(`building the card scene…`);
    const og = join(site, 'og');
    const built = spawnSync('cargo', ['build', '--release', '-q'], { cwd: og, stdio: 'inherit' });
    if (built.status !== 0) process.exit(1);
    mkdirSync(out, { recursive: true });
    for (const path of todo) {
      const card = cards[path]!;
      const r = spawnSync(
        join(og, 'target/release/og'),
        ['render', '--cpu', '--at', '1', '--out', join(site, 'static', card.image)],
        {
          cwd: og,
          env: { ...process.env, OG_TITLE: card.title, OG_SECTION: card.section },
          encoding: 'utf8',
        },
      );
      if (r.status !== 0) throw new Error(`${path}: ${r.stderr}`);
      console.log(`${card.image}  ${card.section} · ${card.title}`);
    }
  }
  writeFileSync(manifest, JSON.stringify(cards, null, 2) + '\n');
  console.log(`${Object.keys(cards).length} cards, ${todo.length} rendered`);
}
