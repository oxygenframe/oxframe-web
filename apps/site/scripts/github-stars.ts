// Refreshes src/lib/stars.json with the star count of oxframe-sdk on GitHub.
// Runs before every site build, so visitors' browsers do not call the
// GitHub API (60 requests an hour per address without a token). If GitHub
// is unreachable the last saved count is kept and the build goes on.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const file = join(import.meta.dir, '../src/lib/stars.json');

const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;

async function fetchStars(): Promise<number> {
  const res = await fetch('https://api.github.com/repos/oxygenframe/oxframe-sdk', {
    headers: {
      'User-Agent': 'oxframe.dev site build (https://oxframe.dev)',
      // A token, when the build has one, lifts the 60-an-hour limit.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`GitHub: ${res.status}`);
  const body = (await res.json()) as { stargazers_count?: number };
  if (typeof body.stargazers_count !== 'number') throw new Error('GitHub: no star count');
  return body.stargazers_count;
}

if (import.meta.main) {
  const saved = JSON.parse(readFileSync(file, 'utf8')) as { stars: number | null };
  try {
    const stars = await fetchStars();
    writeFileSync(file, JSON.stringify({ stars }, null, 2) + '\n');
    console.log(`stars: ${stars}`);
  } catch (e) {
    console.warn(`stars: kept ${saved.stars} (${(e as Error).message})`);
  }
}
