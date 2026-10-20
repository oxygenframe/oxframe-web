// Refreshes src/lib/versions.json — the published, non-yanked versions of
// the `oxframe` crate — from crates.io. Runs before every site build. If
// crates.io is unreachable the last saved list is kept and the build goes on.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SDK_VERSION } from '../src/lib/sdk';

const file = join(import.meta.dir, '../src/lib/versions.json');
const saved = JSON.parse(readFileSync(file, 'utf8')) as { crate: string; versions: string[] };

/** Newest first, by numeric major.minor.patch (pre-releases after their release). */
export function sortVersions(versions: string[]): string[] {
  const key = (v: string) => v.split(/[.-]/).map((p) => (/^\d+$/.test(p) ? Number(p) : -1));
  return [...versions].sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const d = (y[i] ?? 0) - (x[i] ?? 0);
      if (d) return d;
    }
    return 0;
  });
}

async function fetchVersions(crate: string): Promise<string[]> {
  const versions: string[] = [];
  let url: string | null = `https://crates.io/api/v1/crates/${crate}/versions?per_page=100`;
  while (url) {
    // crates.io requires a descriptive User-Agent.
    const res: Response = await fetch(url, {
      headers: { 'User-Agent': 'oxframe.dev site build (https://oxframe.dev)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`crates.io: ${res.status}`);
    const body = (await res.json()) as {
      versions: { num: string; yanked: boolean }[];
      meta: { next_page: string | null };
    };
    versions.push(...body.versions.filter((v) => !v.yanked).map((v) => v.num));
    url = body.meta.next_page
      ? `https://crates.io/api/v1/crates/${crate}/versions${body.meta.next_page}`
      : null;
  }
  return sortVersions(versions);
}

if (import.meta.main) {
  try {
    const versions = await fetchVersions(saved.crate);
    if (!versions.length) throw new Error('no versions');
    writeFileSync(file, `${JSON.stringify({ ...saved, versions }, null, 2)}\n`);
    console.log(`versions.json: ${versions.join(', ')}`);
  } catch (e) {
    console.warn(`versions.json: kept the saved list (${(e as Error).message})`);
  }
  // The site describes src/lib/sdk.ts's version: deploying docs for a
  // version nobody can install is a bug. Production builds (Cloudflare
  // Workers Builds sets WORKERS_CI=1) refuse; local builds only warn.
  const published = (JSON.parse(readFileSync(file, 'utf8')) as { versions: string[] }).versions;
  if (!published.includes(SDK_VERSION)) {
    const msg =
      `src/lib/sdk.ts says oxframe ${SDK_VERSION}, which is not on crates.io ` +
      `(published: ${published.join(', ')}). Release the SDK (tag v${SDK_VERSION}) first.`;
    if (process.env.WORKERS_CI === '1') {
      console.error(`error: ${msg}`);
      process.exit(1);
    }
    console.warn(`warning: ${msg}`);
  }
}
