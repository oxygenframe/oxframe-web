// Redirects of the static site, shared by the Cloudflare build (_redirects)
// and serve.ts. The current docs also answer at their versioned URL
// (/docs/0.1/…), so links pinned to a version keep working until that
// version is archived.
import { SDK_VERSION } from './src/lib/sdk';

const series = SDK_VERSION.split('.').slice(0, 2).join('.');

/** `[from, to, status]`; a trailing `*` in `from` matches the rest as `:splat`. */
export const REDIRECTS: [string, string, number][] = [
  [`/docs/${series}`, '/docs', 301],
  [`/docs/${series}/*`, '/docs/:splat', 301],
];

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
