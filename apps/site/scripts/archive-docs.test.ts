import { describe, expect, it } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { archiveDocs, rewriteLinks } from './archive-docs';

describe('archive-docs', () => {
  it('rewrites links into the snapshot, once', () => {
    expect(rewriteLinks('<a href="/docs/guide/hello">x</a>', '0.1')).toBe(
      '<a href="/docs/0.1/guide/hello">x</a>',
    );
    expect(rewriteLinks('<a href="/docs">docs</a> <a href="/docs#a">a</a>', '0.1')).toBe(
      '<a href="/docs/0.1">docs</a> <a href="/docs/0.1#a">a</a>',
    );
    expect(rewriteLinks('<a href="/playground?ex=intro">p</a>', '0.1')).toBe(
      '<a href="/playground?v=0.1&ex=intro">p</a>',
    );
    // Already versioned, other sites and look-alikes stay as they are.
    expect(
      rewriteLinks('"/docs/0.2/cli" "/docs/0.2.1/cli" "https://docs.rs/oxframe" "/docsy"', '0.1'),
    ).toBe('"/docs/0.2/cli" "/docs/0.2.1/cli" "https://docs.rs/oxframe" "/docsy"');
    expect(rewriteLinks('<a href="/docs/cli">', '0.2.1')).toBe('<a href="/docs/0.2.1/cli">');
  });

  it('copies pages (not the layout or older snapshots) and registers the version', () => {
    const root = mkdtempSync(join(tmpdir(), 'archive-'));
    const routes = join(root, 'routes/docs');
    const lib = join(root, 'lib/docs-archive');
    mkdirSync(join(routes, 'guide/hello'), { recursive: true });
    mkdirSync(join(routes, '0.0'), { recursive: true });
    writeFileSync(join(routes, '+layout.svelte'), 'layout');
    writeFileSync(join(routes, '+page.svelte'), '<a href="/docs/guide/hello">next</a>');
    writeFileSync(join(routes, 'guide/hello/+page.svelte'), 'hello');
    writeFileSync(join(routes, '0.0/+page.svelte'), 'old');
    const sections = [
      { title: 'Guide', pages: [{ slug: 'guide/hello', title: 'Hi', description: 'd' }] },
    ];

    archiveDocs({ series: '0.1', routesDir: routes, archiveDir: lib, sections });

    expect(readFileSync(join(routes, '0.1/+page.svelte'), 'utf8')).toBe(
      '<a href="/docs/0.1/guide/hello">next</a>',
    );
    expect(readFileSync(join(routes, '0.1/guide/hello/+page.svelte'), 'utf8')).toBe('hello');
    expect(existsSync(join(routes, '0.1/+layout.svelte'))).toBe(false);
    expect(existsSync(join(routes, '0.1/0.0'))).toBe(false);
    expect(readFileSync(join(lib, '0.1.ts'), 'utf8')).toContain('"slug": "guide/hello"');
    expect(readFileSync(join(lib, 'index.ts'), 'utf8')).toContain("'0.1': v0_1,");
    expect(() =>
      archiveDocs({ series: '0.1', routesDir: routes, archiveDir: lib, sections }),
    ).toThrow(/already archived/);
  });
});
