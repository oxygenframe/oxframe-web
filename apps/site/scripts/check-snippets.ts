// Compiles every Rust snippet on the site — the current docs (not the
// archived snapshots), the home page, /rust — against the SDK the docs
// describe, so a renamed method or a changed signature fails here instead of
// in a reader's editor.
//
//   bun scripts/check-snippets.ts        (needs cargo)
//
// A snippet is a scene body: it is wrapped in `async fn(view: View)` with the
// prelude in scope. A snippet that defines items (`fn`, `struct`, `impl`,
// `#[derive]`) is placed at module level instead. Two comments, which Svelte
// drops from the HTML, steer it; they go right before the `<pre>`:
//
//   <!-- snippet-setup: let axes = view.add(Axes::new()); -->
//       code the snippet assumes, prepended inside the function
//   <!-- snippet-after: 0 -->
//       an earlier snippet of the same page that this one continues
//       (by its index among the page's Rust snippets), prepended
//   <!-- snippet-skip: why -->
//       not compiled (a fragment of a signature, pseudo-code)
//
// Shell commands, TOML and JSON are recognized and skipped.
//
// The SDK is OXFRAME_SDK_PATH when set (release-check, before the tag),
// else the crates.io version in src/lib/sdk.ts.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const site = join(import.meta.dir, '..');
const routes = join(site, 'src/routes');
const docs = join(routes, 'docs');
const target = join(site, 'og/target');
const crate = join(target, 'snippet-check');
const FEATURES = ['icons', '3d', 'math', 'video', 'unstable-node-api'];

export type Snippet = {
  page: string;
  index: number;
  code: string;
  setup: string;
  skip: string | null;
};

const ENTITIES: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
};

/** Rust snippets of one page, in order. */
export function snippets(page: string, source: string): Snippet[] {
  const out: Snippet[] = [];
  const re =
    /((?:<!--\s*snippet-(?:setup|skip|after):[\s\S]*?-->\s*)*)<pre><code([^>]*)>\s*(?:\{`([\s\S]*?)`\}|([\s\S]*?))\s*<\/code\s*>\s*<\/pre>/g;
  let index = 0;
  for (const m of source.matchAll(re)) {
    const notes = m[1] ?? '';
    const code = m[3] !== undefined ? unTemplate(m[3]) : unEntity(m[4] ?? '');
    if (!isRust(code)) continue;
    const after = [...notes.matchAll(/<!--\s*snippet-after:([\s\S]*?)-->/g)]
      .flatMap((s) => s[1]!.split(','))
      .map(
        (n) =>
          out[Number(n.trim())]?.code ?? `compile_error!("snippet-after: no snippet ${n.trim()}");`,
      );
    const own = [...notes.matchAll(/<!--\s*snippet-setup:([\s\S]*?)-->/g)].map((s) => s[1]!.trim());
    const setup = [...after, ...own].join('\n');
    const skip = /<!--\s*snippet-skip:([\s\S]*?)-->/.exec(notes)?.[1]?.trim() ?? null;
    out.push({ page, index: index++, code, setup, skip });
  }
  return out;
}

function unTemplate(s: string): string {
  return s
    .replace(/\\`/g, '`')
    .replace(/\\\$\{/g, '${')
    .replace(/\\\\/g, '\\');
}

function unEntity(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&(lt|gt|amp|quot|#39);/g, (e) => ENTITIES[e]!);
}

/** Shell, TOML and JSON blocks are not Rust. */
export function isRust(code: string): boolean {
  const first = code.trimStart().split('\n')[0] ?? '';
  if (
    /^(\$\{|\$ |docker |podman |oxframe |cargo |npm |npx |bun |curl |git |brew |cd |\/plugin|codex |claude |sh |#!|# |winget |scoop )/.test(
      first,
    )
  )
    return false;
  if (/^\[[\w.-]+\]\s*$/.test(first) || /^[\w-]+\s*=\s*[{"[\d]/.test(first)) return false;
  // YAML (a CI workflow): `jobs:` alone on the first line.
  if (/^[\w-]+:\s*$/.test(first)) return false;
  if (/^[{[]/.test(first.trim()) && !/;\s*$/.test(code.trim())) return false;
  return /[;{}]|\.await|::|=>|\bfn\b|\blet\b/.test(code);
}

const ITEM = /^(#\[|pub |fn |async fn |struct |enum |impl |use |const |static |mod |trait )/;

/**
 * Top-level items (`use`, `struct`, `impl`, `fn`) and the statements around
 * them, told apart by brace depth.
 */
export function split(code: string): { items: string; stmts: string } {
  const items: string[] = [];
  const stmts: string[] = [];
  let depth = 0;
  let mode: 'item' | 'stmt' = 'stmt';
  for (const line of code.split('\n')) {
    if (depth === 0 && line.trim()) mode = ITEM.test(line) ? 'item' : 'stmt';
    (mode === 'item' ? items : stmts).push(line);
    const bare = line.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/\/\/.*$/, '');
    depth += (bare.match(/\{/g)?.length ?? 0) - (bare.match(/\}/g)?.length ?? 0);
  }
  return { items: items.join('\n').trim(), stmts: stmts.join('\n').trim() };
}

/** `code` and its `// comment`, the comment kept outside a `;` added later. */
function comment(line: string): [string, string] {
  const at = line.replace(/"(?:[^"\\]|\\.)*"/g, (m) => ' '.repeat(m.length)).indexOf('//');
  return at < 0 ? [line, ''] : [line.slice(0, at).trimEnd(), ' ' + line.slice(at)];
}

/**
 * Docs often show expressions, not statements: a builder chain on its own,
 * or a list of builders one per line. Each becomes `let _ = …;`.
 */
export function statements(code: string): string {
  return code
    .split(/\n\s*\n/)
    .map((para) => {
      const lines = para.split('\n');
      const ends = (l: string) => /[;{}]\s*$|\.await\s*$/.test(comment(l)[0]);
      const code = lines.map((l) => comment(l)[0]).filter((l) => l.trim());
      if (!code.length) return para;
      // A reference list: one expression or awaited call per line, no `;`.
      const balanced = (l: string) =>
        (l.match(/\(/g)?.length ?? 0) === (l.match(/\)/g)?.length ?? 0);
      if (
        code.length > 1 &&
        code.every((l) => balanced(l) && !/[;{}]\s*$/.test(l) && !/^\s*\./.test(l))
      )
        return lines
          .map((l) => {
            const [c, note] = comment(l);
            if (!c.trim()) return l;
            return /\.await\s*$/.test(c) ? `${c};${note}` : `let _ = ${c.trimStart()};${note}`;
          })
          .join('\n');
      const last = lines.findLastIndex((l) => comment(l)[0].trim());
      if (ends(lines[last]!) || /^\s*(let|if|for|while|match|loop|return)\b/.test(code[0]!))
        return para;
      const [c, note] = comment(lines[last]!);
      lines[last] = `${c};${note}`;
      return `let _ = ${lines.join('\n')}`;
    })
    .join('\n\n');
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      // Archived snapshots (/docs/0.20.5/…) describe older versions.
      if (dir === docs && /^\d+\.\d+/.test(name)) continue;
      files.push(...walk(path));
    } else if (name === '+page.svelte') files.push(path);
  }
  return files;
}

function moduleName(s: Snippet): string {
  const page = s.page.replace(/\/?\+page\.svelte$/, '').replace(/[^a-z0-9]+/gi, '_') || 'index';
  return `s_${page}_${s.index}`.toLowerCase();
}

export function wrap(s: Snippet): string {
  const code = split(s.code);
  const setup = split(s.setup);
  const body = [setup.stmts, statements(code.stmts)].filter(Boolean).join('\n');
  const inner = [setup.items, code.items, body ? `async fn snippet(view: View) {\n${body}\n}` : '']
    .filter(Boolean)
    .join('\n');
  return `// ${s.page} #${s.index}\n#[allow(unused, dead_code, unreachable_code, clippy::all)]\nmod ${moduleName(s)} {\nuse oxframe::prelude::*;\n${inner}\n}\n`;
}

function dependency(): string {
  const features = FEATURES.map((f) => `"${f}"`).join(', ');
  const path = process.env.OXFRAME_SDK_PATH;
  if (path)
    return `oxframe = { path = "${join(path, 'crates/oxframe')}", features = [${features}] }`;
  const sdk = readFileSync(join(site, 'src/lib/sdk.ts'), 'utf8');
  const version = /SDK_VERSION\s*=\s*'([^']+)'/.exec(sdk)![1];
  return `oxframe = { version = "=${version}", features = [${features}] }`;
}

if (import.meta.main) {
  const all = walk(routes).flatMap((file) =>
    snippets(relative(routes, file), readFileSync(file, 'utf8')),
  );
  const checked = all.filter((s) => !s.skip);
  rmSync(crate, { recursive: true, force: true });
  mkdirSync(join(crate, 'src'), { recursive: true });
  writeFileSync(
    join(crate, 'Cargo.toml'),
    `[package]\nname = "snippet-check"\nversion = "0.0.0"\nedition = "2024"\npublish = false\n\n[dependencies]\n${dependency()}\n\n[workspace]\n`,
  );
  // One line map per module, to point an error back at its page.
  const lines: { start: number; s: Snippet }[] = [];
  let text = '';
  for (const s of checked) {
    lines.push({ start: text.split('\n').length, s });
    text += wrap(s) + '\n';
  }
  writeFileSync(join(crate, 'src/lib.rs'), text);
  const r = spawnSync('cargo', ['check', '--quiet', '--message-format=short'], {
    cwd: crate,
    encoding: 'utf8',
    env: { ...process.env, CARGO_TARGET_DIR: target },
  });
  const skipped = all.length - checked.length;
  if (r.status === 0) {
    console.log(`check-snippets: ${checked.length} Rust snippets compile (${skipped} skipped)`);
    process.exit(0);
  }
  const owner = (line: number) => [...lines].reverse().find((l) => l.start <= line)?.s;
  const failed = new Map<Snippet, string[]>();
  for (const err of (r.stderr + r.stdout).split('\n')) {
    const m = /src\/lib\.rs:(\d+):\d+: (error.*)/.exec(err);
    if (!m) continue;
    const s = owner(Number(m[1]));
    if (!s) continue;
    failed.set(s, [...(failed.get(s) ?? []), m[2]!]);
  }
  if (!failed.size) {
    console.error(r.stderr + r.stdout);
    process.exit(1);
  }
  for (const [s, errs] of failed) {
    console.error(`\n${s.page} #${s.index}: ${s.code.split('\n')[0]}`);
    for (const e of [...new Set(errs)].slice(0, 4)) console.error(`  ${e}`);
  }
  console.error(`\ncheck-snippets: ${failed.size} of ${checked.length} snippets do not compile`);
  process.exit(1);
}
