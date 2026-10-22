// A Markdown copy of every docs page and agents page, next to its HTML:
// /docs/guide/hello → /docs/guide/hello.md. Agents and tools read it without
// parsing the site's markup. Runs after `vite build`, on the prerendered
// HTML, so the Markdown is exactly what the page shows.
//
//   bun scripts/markdown-pages.ts [build dir]
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE = 'https://oxframe.dev';

const entities: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
  '&#123;': '{',
  '&#125;': '}',
};
const decode = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|#39|nbsp|#123|#125);/g, (m) => entities[m] ?? m);

/** Text inside an element, tags dropped. */
const text = (html: string) => decode(html.replace(/<[^>]+>/g, ''));

/** Inline markup: code, strong, em and links; everything else as text. */
function inline(html: string): string {
  return decode(
    html
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (_, c: string) => `\`${text(c)}\``)
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, '**$2**')
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, '*$2*')
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href: string, label: string) => {
        const url = href.startsWith('/') ? `${SITE}${href}` : href;
        return `[${text(label).trim()}](${url})`;
      })
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** The Markdown of one block-level fragment of HTML. */
export function toMarkdown(html: string): string {
  const out: string[] = [];
  // Comments, scripts, styles, and the live players (they need the page).
  let rest = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|svg|canvas|iframe)\b[\s\S]*?<\/\1>/g, '');
  const block =
    /<(h[1-6]|p|pre|ul|ol|table|figure|blockquote)\b[^>]*>([\s\S]*?)<\/\1>|<img [^>]*alt="([^"]*)"[^>]*src="([^"]+)"[^>]*>|<img [^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/;
  while (rest.length) {
    const m = block.exec(rest);
    if (!m) break;
    rest = rest.slice(m.index + m[0].length);
    if (m[3] !== undefined || m[5] !== undefined) {
      const [alt, src] = m[3] !== undefined ? [m[3], m[4]!] : [m[6]!, m[5]!];
      out.push(`![${decode(alt)}](${src.startsWith('/') ? SITE + src : src})`);
      continue;
    }
    const [, tag, inner] = m as unknown as [string, string, string];
    if (/^h[1-6]$/.test(tag)) {
      out.push(`${'#'.repeat(Number(tag[1]))} ${inline(inner)}`);
    } else if (tag === 'p' || tag === 'blockquote') {
      const t = inline(inner);
      if (t) out.push(tag === 'blockquote' ? `> ${t}` : t);
    } else if (tag === 'pre') {
      // Shiki wraps every line in spans; the text is what counts.
      const code = text(inner.replace(/<\/span><span class="line">/g, '\n')).replace(/\n+$/, '');
      out.push('```\n' + code + '\n```');
    } else if (tag === 'ul' || tag === 'ol') {
      const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(
        (li, i) => `${tag === 'ol' ? `${i + 1}.` : '-'} ${inline(li[1]!)}`,
      );
      out.push(items.join('\n'));
    } else if (tag === 'table') {
      const rows = [...inner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
        [...r[1]!.matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) =>
          inline(c[1]!).replace(/\|/g, '\\|'),
        ),
      );
      if (rows.length) {
        const width = Math.max(...rows.map((r) => r.length));
        const line = (r: string[]) =>
          `| ${[...r, ...Array(width - r.length).fill('')].join(' | ')} |`;
        out.push(
          [
            line(rows[0]!),
            `| ${Array(width).fill('---').join(' | ')} |`,
            ...rows.slice(1).map(line),
          ].join('\n'),
        );
      }
    } else if (tag === 'figure') {
      out.push(
        toMarkdown(inner.replace(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g, '<p>$1</p>')),
      );
    }
  }
  return (
    out
      // The live player's placeholder: the code block after it is the example.
      .filter((b) => b && b !== 'Loading live preview…')
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n') + '\n'
  );
}

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...htmlFiles(path));
    else if (name.endsWith('.html')) out.push(path);
  }
  return out;
}

if (import.meta.main) {
  const build = process.argv[2] ?? join(import.meta.dir, '../build');
  let written = 0;
  for (const file of htmlFiles(build)) {
    const path =
      '/' +
      relative(build, file)
        .replace(/\.html$/, '')
        .replace(/(^|\/)index$/, '');
    // Current docs and the agents pages; archived docs (/docs/0.x.y/) are not.
    if (!/^\/(docs|agents)(\/|$)/.test(path) || /^\/docs\/\d+\.\d+/.test(path)) continue;
    const html = readFileSync(file, 'utf8');
    // Docs pages: the article (no menu). Agents pages: the whole page area.
    const main = path.startsWith('/docs')
      ? /<article\b[^>]*>([\s\S]*?)<\/article>/.exec(html)?.[1]
      : /<(?:div|main) class="page[^"]*">([\s\S]*?)<footer/.exec(html)?.[1];
    if (!main) continue;
    writeFileSync(file.replace(/\.html$/, '.md'), `<!-- ${SITE}${path} -->\n` + toMarkdown(main));
    written++;
  }
  console.log(`wrote ${written} Markdown pages`);
}
