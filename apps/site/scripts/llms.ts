// Writes the plain-text docs for language models.
//
//   bun scripts/llms.ts
//
// Current docs become static/llms.txt (served at /llms.txt). Each archived
// series becomes static/docs/<series>/llms.txt and llms-full.txt. The current
// series URL redirects to /llms.txt (see redirects.ts), so a pinned link keeps
// working after that series is archived. Run on every site build.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { DocSection } from '../src/lib/docs';
import { sections } from '../src/lib/docs';
import { archives } from '../src/lib/docs-archive';

const site = join(import.meta.dir, '..');

export function llmsIndex(
  base: string,
  fullHref: string,
  list: DocSection[],
  markdown = false,
): string {
  const lines = [
    '# oxframe',
    '',
    'oxframe is procedural animation in Rust. Scenes are async functions; awaiting an animation takes time.',
    '',
    `Full text: ${fullHref}`,
    '',
    // Only the current docs have Markdown copies (scripts/markdown-pages.ts).
    ...(markdown ? ['Every page also has a Markdown version: add .md to its URL.', ''] : []),
  ];
  for (const section of list) {
    lines.push(`## ${section.title}`, '');
    for (const page of section.pages) {
      const href = page.slug ? `${base}/${page.slug}` : base;
      lines.push(`- [${page.title}](${href}): ${page.description}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Drops Svelte markup so a page can be read as text. */
export function pageText(source: string): string {
  return source
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/\{`([\s\S]*?)`\}/g, '\n$1\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function pagesIn(dir: string): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...pagesIn(path));
    else if (name === '+page.svelte') out.push(path);
  }
  return out.sort();
}

export function llmsFull(series: string, routesDir: string): string {
  const pages = pagesIn(routesDir);
  const chunks = [
    `# oxframe ${series}`,
    '',
    'Text of this version of the documentation. Code samples are the fenced blocks from the pages.',
    '',
  ];
  for (const path of pages) {
    const text = pageText(readFileSync(path, 'utf8'));
    if (text) chunks.push(text, '');
  }
  return chunks.join('\n');
}

/** Writes the current index and one pair of files per archived series. */
export function writeLlms(): string[] {
  const written: string[] = [];
  const index = llmsIndex(
    'https://oxframe.dev/docs',
    'https://oxframe.dev/llms-full.txt',
    sections,
    true,
  );
  const indexPath = join(site, 'static/llms.txt');
  writeFileSync(indexPath, index);
  written.push(indexPath);
  for (const [series, list] of Object.entries(archives)) {
    const dir = join(site, 'static/docs', series);
    mkdirSync(dir, { recursive: true });
    const base = `https://oxframe.dev/docs/${series}`;
    const short = join(dir, 'llms.txt');
    const full = join(dir, 'llms-full.txt');
    writeFileSync(short, llmsIndex(base, `${base}/llms-full.txt`, list));
    writeFileSync(full, llmsFull(series, join(site, 'src/routes/docs', series)));
    written.push(short, full);
  }
  return written;
}

if (import.meta.main) {
  const files = writeLlms();
  console.log(`wrote ${files.length} llms files`);
}
