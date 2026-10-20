import { describe, expect, it } from 'bun:test';
import { codeText, escapeBraces, guessLang, highlight, highlightCode } from '../highlight.js';

describe('highlight', () => {
  it('reads code bodies the way Svelte would print them', () => {
    expect(codeText('{`let x = a\\`b`;`}')).toBe('let x = a`b`;');
    expect(codeText("{'Rect::new()'}")).toBe('Rect::new()');
    expect(codeText('Vec&lt;f64&gt; &amp;&amp; &#123;')).toBe('Vec<f64> && {');
    // Not plain text: left alone.
    expect(codeText('{`${x}`}')).toBeNull();
    expect(codeText('a <b>bold</b> word')).toBeNull();
    expect(codeText('{value}')).toBeNull();
  });

  it('guesses the language of docs snippets', () => {
    expect(guessLang('oxframe init my-video  # once')).toBe('shellscript');
    expect(guessLang('cargo install oxframe-cli')).toBe('shellscript');
    expect(guessLang('[dev]\nport = 3000')).toBe('toml');
    expect(guessLang('{\n  "rule": "x"\n}')).toBe('json');
    expect(guessLang('let r = view.add(Rect::new());')).toBe('rust');
  });

  it('turns blocks into colored, brace-safe HTML', async () => {
    const html = await highlight('fn main() { let x = 1; }', 'rust');
    expect(html).toStartWith('<pre class="shiki');
    expect(html).toContain('--shiki-dark:');
    expect(html).not.toContain('tabindex');
    expect(escapeBraces(html)).not.toMatch(/[{}]/);
  });

  it('rewrites only the pre/code blocks of route files', async () => {
    const pre = highlightCode();
    const src =
      '<p>{x}</p>\n<pre><code\n    >{`let a = 1;`}</code\n  ></pre>\n<pre><code>{dynamic}</code></pre>';
    const out = await pre.markup!({ content: src, filename: '/x/src/routes/docs/a/+page.svelte' });
    expect(out!.code).toContain('<p>{x}</p>');
    expect(out!.code).toContain('class="shiki');
    expect(out!.code).toContain('<pre><code>{dynamic}</code></pre>');
    expect(await pre.markup!({ content: src, filename: '/x/src/lib/X.svelte' })).toBeUndefined();
  });
});
