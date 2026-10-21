// Copies the agent skills of oxframe-sdk (skills/<name>/SKILL.md) into the
// site as src/lib/skills.json: name, description and the body as HTML with
// highlighted code, for /agents and /agents/skills/<name>. Run with
// sync-examples, so the pages never drift from what `npx skills add` installs.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { highlight } from '../apps/site/highlight.js';

const sdk = process.env.OXFRAME_SDK_PATH ?? join(import.meta.dir, '../../oxframe-sdk');
const from = join(sdk, 'skills');
const out = join(import.meta.dir, '../apps/site/src/lib/skills.json');

export interface Skill {
  name: string;
  description: string;
  html: string;
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** `code`, **bold** and [links](url) in one line of text. */
function inline(text: string): string {
  const parts = text.split(/(`[^`]+`)/);
  return parts
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 1)
        return `<code>${escape(part.slice(1, -1))}</code>`;
      return escape(part)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => {
          // Links to files next to the skill point at the repository.
          const url = /^https?:/.test(href)
            ? href
            : `https://github.com/oxygenframe/oxframe-sdk/blob/main/skills/oxframe/${href}`;
          return `<a href="${url}" rel="external">${label}</a>`;
        });
    })
    .join('');
}

const LANGS: Record<string, string> = {
  rust: 'rust',
  sh: 'shellscript',
  yaml: 'yaml',
  json: 'json',
  toml: 'toml',
  text: 'text',
};

/** The Markdown the skills use: headings, paragraphs, lists, tables, code. */
export async function markdown(src: string): Promise<string> {
  const lines = src.replace(/<!--.*?-->\n?/g, '').split('\n');
  const html: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith('```')) body.push(lines[i++]!);
      i++;
      const lang = LANGS[fence[1] ?? ''] ?? 'text';
      html.push(
        lang === 'text' || lang === 'yaml'
          ? `<pre><code>${escape(body.join('\n'))}</code></pre>`
          : await highlight(body.join('\n'), lang),
      );
      continue;
    }
    const heading = line.match(/^(#{1,4}) (.*)/);
    if (heading) {
      // The page has its own h1; skill headings start at h2.
      const level = Math.min(heading[1]!.length + 1, 4);
      html.push(`<h${level}>${inline(heading[2]!)}</h${level}>`);
      i++;
      continue;
    }
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.startsWith('|')) {
        const cells = lines[i]!.trim()
          .replace(/^\||\|$/g, '')
          .split(' | ')
          .map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      html.push(
        `<table><thead><tr>${head!.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>` +
          body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') +
          '</tbody></table>',
      );
      continue;
    }
    const item = line.match(/^(\s*)(- |\d+\. )(.*)/);
    if (item) {
      const ordered = /\d/.test(item[2]!);
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i]!.match(/^(- |\d+\. )(.*)/);
        if (m) items.push(m[2]!);
        else if (/^\s{2,}\S/.test(lines[i]!) && items.length)
          items[items.length - 1] += ' ' + lines[i]!.trim();
        else break;
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
      continue;
    }
    if (line.trim() === '') {
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() !== '' && !/^(```|#|\||- |\d+\. )/.test(lines[i]!))
      para.push(lines[i++]!.trim());
    html.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return html.join('\n');
}

/** Name, description and body of a SKILL.md. */
export function parseSkill(text: string): { name: string; description: string; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('SKILL.md has no frontmatter');
  const field = (key: string) => {
    const line = m[1]!.split('\n').find((l) => l.startsWith(`${key}:`));
    const value = line?.slice(key.length + 1).trim() ?? '';
    return value.startsWith('"') ? (JSON.parse(value) as string) : value;
  };
  return { name: field('name'), description: field('description'), body: m[2]! };
}

if (import.meta.main) {
  if (!existsSync(from)) {
    console.error(`no skills at ${from}`);
    process.exit(1);
  }
  const skills: Skill[] = [];
  for (const dir of readdirSync(from).sort()) {
    const path = join(from, dir, 'SKILL.md');
    if (!existsSync(path)) continue;
    const { name, description, body } = parseSkill(readFileSync(path, 'utf8'));
    // The page's h1 is the skill name; drop the body's own first title.
    const html = await markdown(body.replace(/^\s*# .*\n/, ''));
    skills.push({ name, description, html });
  }
  // The main skill first, the rest by name.
  skills.sort((a, b) =>
    a.name === 'oxframe' ? -1 : b.name === 'oxframe' ? 1 : a.name.localeCompare(b.name),
  );
  writeFileSync(out, JSON.stringify(skills, null, 2) + '\n');
  console.log(`synced ${skills.length} skills from ${from}`);
}
