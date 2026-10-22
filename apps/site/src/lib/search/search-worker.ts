// Docs search off the main thread. Pagefind (built into /pagefind/ after the
// site build) compiles wasm, which only workers may do: this script is served
// with its own CSP that allows it (serve.ts, scripts/cf-headers.ts).
export interface Hit {
  url: string;
  title: string;
  /** HTML from Pagefind: escaped text with <mark> around the matches. */
  excerpt: string;
}

interface Pagefind {
  options(o: object): Promise<void>;
  search(q: string): Promise<{ results: { data(): Promise<PageData> }[] }>;
}
interface PageData {
  url: string;
  meta: { title?: string };
  excerpt: string;
  sub_results?: { url: string; title: string; excerpt: string; locations: number[] }[];
}

let pagefind: Promise<Pagefind> | undefined;
// A variable, so the bundler leaves the runtime path alone.
const PAGEFIND = '/pagefind/pagefind.js';

async function load(): Promise<Pagefind> {
  const pf = (await import(/* @vite-ignore */ PAGEFIND)) as Pagefind;
  await pf.options({ excerptLength: 20 });
  return pf;
}

/** /docs/cli.html#flags → /docs/cli#flags (pages are served without .html). */
const clean = (url: string) => url.replace(/\.html(?=#|$)/, '');

self.onmessage = async (e: MessageEvent<{ id: number; q: string }>) => {
  const { id, q } = e.data;
  try {
    pagefind ??= load();
    const pf = await pagefind;
    const { results } = await pf.search(q);
    const pages = await Promise.all(results.slice(0, 8).map((r) => r.data()));
    const hits: Hit[] = pages.map((p) => {
      // The section with the most matches, when it has a heading of its own
      // (Pagefind lists sections in page order).
      const sub = p.sub_results
        ?.filter((s) => s.url.includes('#') && s.locations.length)
        .sort((a, b) => b.locations.length - a.locations.length)[0];
      return {
        url: clean(sub?.url ?? p.url),
        title:
          sub && sub.title !== p.meta.title
            ? `${p.meta.title} › ${sub.title}`
            : (p.meta.title ?? p.url),
        excerpt: sub?.excerpt ?? p.excerpt,
      };
    });
    self.postMessage({ id, hits });
  } catch (err) {
    pagefind = undefined;
    self.postMessage({ id, error: String(err) });
  }
};
