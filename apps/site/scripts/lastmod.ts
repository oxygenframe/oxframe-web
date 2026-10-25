// Refreshes src/lib/lastmod.json: the day each page's source last changed in
// git, for <lastmod> in sitemap.xml. Keys are route directories ("/docs/cli",
// "/agents/[agent]") and the data files some pages are built from
// ("lib/agents.ts"); uncommitted changes count as today. Runs before every
// site build. A shallow clone (Workers Builds) fetches the rest of the
// history first; if that fails the saved dates are kept and the build goes on.
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const src = join(import.meta.dir, '../src');
const routes = join(src, 'routes');
const file = join(src, 'lib/lastmod.json');

/** Data files that pages are generated from (see routes/sitemap.xml). */
export const DATA = [
  'lib/agents.ts',
  'lib/skills.json',
  'lib/gallery.ts',
  'lib/media.json',
  'lib/use-cases.ts',
];

function git(args: string[]): string | null {
  // TZ=UTC: dates are UTC days, like `today` (a commit after midnight in
  // Europe is still yesterday in UTC).
  const r = spawnSync('git', args, {
    cwd: src,
    encoding: 'utf8',
    env: { ...process.env, TZ: 'UTC' },
  });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** Route directories with a page, archived docs (/docs/0.x…) left out. */
function pageDirs(dir: string): string[] {
  const out: string[] = [];
  const names = readdirSync(dir);
  if (names.some((n) => n.startsWith('+page.'))) out.push(dir);
  for (const name of names) {
    const path = join(dir, name);
    if (statSync(path).isDirectory() && !/^\d+\.\d+/.test(name)) out.push(...pageDirs(path));
  }
  return out;
}

const today = new Date().toISOString().slice(0, 10);

/** Day `paths` last changed (YYYY-MM-DD): today if they have uncommitted edits. */
function lastChange(paths: string[]): string | null {
  if (git(['status', '--porcelain', '--', ...paths])) return today;
  return git(['log', '-1', '--format=%cd', '--date=format-local:%Y-%m-%d', '--', ...paths]) || null;
}

if (import.meta.main) {
  if (git(['rev-parse', '--is-shallow-repository']) === 'true')
    git(['fetch', '--unshallow', '--quiet']);
  if (git(['rev-parse', '--is-shallow-repository']) !== 'false') {
    console.log('lastmod: no full git history, keeping the saved dates');
    process.exit(0);
  }
  const dates: Record<string, string> = {};
  for (const dir of pageDirs(routes)) {
    const pages = readdirSync(dir)
      .filter((n) => n.startsWith('+page.'))
      .map((n) => join(dir, n));
    const day = lastChange(pages);
    if (day) dates['/' + relative(routes, dir)] = day;
  }
  // The examples the gallery pages show.
  const examples = readdirSync(join(src, 'lib/examples'))
    .filter((f) => f.endsWith('.rs'))
    .map((f) => `lib/examples/${f}`);
  for (const data of [...DATA, ...examples]) {
    const day = lastChange([join(src, data)]);
    if (day) dates[data] = day;
  }
  const sorted = Object.fromEntries(Object.entries(dates).sort(([a], [b]) => a.localeCompare(b)));
  const before = readFileSync(file, { encoding: 'utf8', flag: 'a+' });
  const after = JSON.stringify(sorted, null, 2) + '\n';
  if (before !== after) writeFileSync(file, after);
  console.log(`lastmod: ${Object.keys(sorted).length} dates`);
}
