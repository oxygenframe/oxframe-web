// Redirects of the static site, shared by the Cloudflare build (_redirects)
// and serve.ts. The current docs also answer at their versioned URL
// (/docs/0.1/…), so links pinned to a version keep working until that
// version is archived.
import { archives } from './src/lib/docs-archive';
import { SDK_VERSION } from './src/lib/sdk';
import versions from './src/lib/versions.json';

const series = SDK_VERSION.split('.').slice(0, 2).join('.');

/** `[from, to, status]`; a trailing `*` in `from` matches the rest as `:splat`. */
/** Versions that have a snapshot of their own under /docs/<version>/. A
 *  static import, because serve.ts runs as one compiled binary with no
 *  source tree to read. */
const archived = new Set(Object.keys(archives));

/** Earlier patches of the current series (0.12.0 while 0.12.1 is current)
 *  share its docs, so a link pinned to one lands on the current page. */
const patches = versions.versions.filter(
  (v) => v !== SDK_VERSION && v.startsWith(`${series}.`) && !archived.has(v),
);

// The current docs under their series (/docs/0.2/…), exact version
// (/docs/0.2.6/…) and earlier patches of the series.
export const REDIRECTS: [string, string, number][] = [series, SDK_VERSION, ...patches].flatMap(
  (v): [string, string, number][] => [
    [`/docs/${v}/llms.txt`, '/llms.txt', 301],
    [`/docs/${v}/llms-full.txt`, '/llms-full.txt', 301],
    [`/docs/${v}`, '/docs', 301],
    [`/docs/${v}/*`, '/docs/:splat', 301],
  ],
);

// Pages that moved.
REDIRECTS.push(['/programmatic-video-rust', '/rust', 301]);
REDIRECTS.push(['/remotion-alternative', '/alternatives/remotion', 301]);
REDIRECTS.push(['/manim-alternative', '/vs/manim', 301]);

/** `0.7.0` < `0.8.0` < `0.12.1`, part by part as numbers. */
function compare(a: string, b: string): number {
  const [x, y] = [a.split('.').map(Number), b.split('.').map(Number)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

const snapshots = [...archived].sort(compare);

/** Docs for a version or series with no snapshot of its own: the newest
 *  snapshot of that series, else the next newer snapshot (whose docs cover
 *  what that version had), else the current docs. */
function nearest(version: string): string {
  const own = snapshots.filter((s) => s.startsWith(`${version}.`));
  if (own.length > 0) return `/docs/${own[own.length - 1]}`;
  const newer = snapshots.find((s) => compare(s, version) > 0);
  return newer ? `/docs/${newer}` : '/docs';
}

const seriesOf = (v: string) => v.split('.').slice(0, 2).join('.');

/** Older versions and series without a snapshot of their own (0.7.0, the
 *  /docs/0.15 series of the 0.15.0 snapshot) land on the nearest docs, so
 *  no pinned link answers 404. */
const missing = [...new Set(versions.versions.flatMap((v) => [v, seriesOf(v)]))].filter(
  (v) =>
    !archived.has(v) &&
    seriesOf(v) !== series &&
    !REDIRECTS.some(([from]) => from === `/docs/${v}`),
);
for (const v of missing.sort(compare)) {
  const to = nearest(v);
  REDIRECTS.push(
    [`/docs/${v}/llms.txt`, to === '/docs' ? '/llms.txt' : `${to}/llms.txt`, 301],
    [`/docs/${v}`, to, 301],
    [`/docs/${v}/*`, `${to}/:splat`, 301],
  );
}

/** Where `pathname` redirects to, if anywhere. */
export function redirectFor(pathname: string): { to: string; status: number } | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  for (const [from, to, status] of REDIRECTS) {
    if (from.endsWith('/*')) {
      const prefix = from.slice(0, -1);
      if (path.startsWith(prefix))
        return { to: to.replace(':splat', path.slice(prefix.length)), status };
    } else if (path === from) return { to, status };
  }
  return null;
}
