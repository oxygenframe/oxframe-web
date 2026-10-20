// Which oxframe versions have documentation on this site, and how their
// URLs look. The current docs live at /docs/…; an older minor version
// (an archived snapshot) at /docs/<series>/…, e.g. /docs/0.1/guide/hello.
import data from './versions.json' with { type: 'json' };
import { SDK_VERSION } from './sdk';
import { archives } from './docs-archive';

/** `"0.1.3"` → `"0.1"`: docs are versioned per minor release. */
export const seriesOf = (version: string): string => version.split('.').slice(0, 2).join('.');

/** The series the current docs (and the playground) describe. */
export const CURRENT = seriesOf(SDK_VERSION);

/** Published versions of the crate, newest first (refreshed at build time). */
export const RELEASES: readonly string[] = data.versions;

/** Newest published version of a series. */
export function latestPatch(series: string): string {
  return (
    RELEASES.find((v) => seriesOf(v) === series) ??
    (series === CURRENT ? SDK_VERSION : `${series}.0`)
  );
}

export interface DocsVersion {
  series: string;
  /** Newest published version of the series, e.g. `0.1.2`. */
  version: string;
  current: boolean;
}

const bySeries = (a: string, b: string) => {
  const [x, y] = [a.split('.').map(Number), b.split('.').map(Number)];
  return y[0]! - x[0]! || y[1]! - x[1]!;
};

/** Versions in the switcher, newest first: the current docs, then archives. */
export const DOCS_VERSIONS: DocsVersion[] = [CURRENT, ...Object.keys(archives)]
  .filter((s, i, all) => all.indexOf(s) === i)
  .sort(bySeries)
  .map((series) => ({ series, version: latestPatch(series), current: series === CURRENT }));

/** API reference of a version on docs.rs. */
export const docsRs = (version: string): string => `https://docs.rs/oxframe/${version}/oxframe/`;

/** Splits a docs path into its version series and page slug. */
export function locate(pathname: string): { series: string; slug: string } {
  const rest = pathname.replace(/\/+$/, '').replace(/^\/docs\/?/, '');
  const m = /^(\d+\.\d+)(?:\/(.*))?$/.exec(rest);
  if (m && m[1] !== CURRENT) return { series: m[1]!, slug: m[2] ?? '' };
  if (m) return { series: CURRENT, slug: m[2] ?? '' };
  return { series: CURRENT, slug: rest };
}
