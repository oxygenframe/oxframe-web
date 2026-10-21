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
