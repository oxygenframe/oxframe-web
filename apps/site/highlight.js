// Build-time syntax highlighting (Shiki): code blocks become colored spans
// in the prerendered HTML, so no highlighter ships to the browser. Two
// themes as CSS variables; app.css picks one per color scheme.
import { createHighlighter } from 'shiki';

const THEMES = { light: 'github-light', dark: 'github-dark' };
const LANGS = ['rust', 'shellscript', 'toml', 'json'];

let ready;
function highlighter() {
  ready ??= createHighlighter({ themes: Object.values(THEMES), langs: LANGS });
  return ready;
}

/** Best guess for a docs snippet: shell commands, TOML, JSON, else Rust. */
export function guessLang(code) {
  const first = code.trimStart().split('\n')[0] ?? '';
  if (/^(\$ |oxframe |cargo |curl |bun |npm |npx |git |cd |brew |ffmpeg )/.test(first))
    return 'shellscript';
  if (/^\[[\w.-]+\]\s*$/m.test(code) && /^\s*[\w-]+\s*=/m.test(code)) return 'toml';
  if (/^\s*[{[]/.test(first) && /"\s*:/.test(code)) return 'json';
  return 'rust';
}

/** Highlighted `<pre class="shiki">…</pre>` for `code`. */
export async function highlight(code, lang = guessLang(code)) {
  const h = await highlighter();
  return h.codeToHtml(code.replace(/\n$/, ''), {
    lang,
    themes: THEMES,
    defaultColor: false,
    // Shiki makes <pre> focusable for keyboard scrolling; the site's code
    // blocks are short and Svelte's a11y check rejects tabindex on <pre>.
    transformers: [
      {
        pre(node) {
          delete node.properties.tabindex;
        },
      },
    ],
  });
}

/** Escapes braces so Svelte reads highlighted HTML as text, not expressions. */
export const escapeBraces = (html) =>
  html.replace(/[{}]/g, (c) => (c === '{' ? '&#123;' : '&#125;'));

const ENTITIES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) =>
  s.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (m, e) =>
    e[0] === '#'
      ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1))
      : (ENTITIES[e] ?? m),
  );

/**
 * The text of a `<code>` body in a .svelte file, or null when it is not
 * plain: markup inside, or an expression other than a string literal.
 */
export function codeText(body) {
  const t = body.trim();
  const tpl = /^\{`([\s\S]*)`\}$/.exec(t);
  if (tpl) return tpl[1].includes('${') ? null : tpl[1].replace(/\\([`\\$])/g, '$1');
  const str = /^\{(['"])([\s\S]*)\1\}$/.exec(t);
  if (str) return str[2].replace(/\\(.)/g, '$1');
  if (/[<{}]/.test(t)) return null;
  return decode(body.replace(/^\n/, ''));
}

/** Svelte preprocessor: highlights every `<pre><code>` block it can read. */
export function highlightCode() {
  const block = /<pre(\s[^>]*)?>\s*<code(\s[^>]*)?>([\s\S]*?)<\/code\s*>\s*<\/pre\s*>/g;
  return {
    name: 'highlight-code',
    async markup({ content, filename }) {
      if (!filename?.includes('/src/routes/') || !content.includes('<pre')) return;
      const parts = [];
      let last = 0;
      for (const m of content.matchAll(block)) {
        const code = codeText(m[3]);
        if (code === null) continue;
        const lang = /language-([\w-]+)/.exec(m[2] ?? '')?.[1];
        parts.push(content.slice(last, m.index), escapeBraces(await highlight(code, lang)));
        last = m.index + m[0].length;
      }
      if (!parts.length) return;
      parts.push(content.slice(last));
      return { code: parts.join('') };
    },
  };
}
