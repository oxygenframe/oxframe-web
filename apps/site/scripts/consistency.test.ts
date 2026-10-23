// Guards the kinds of drift the audit found (versions, counts, tables) so a
// release every few hours cannot quietly break them. Runs in `bun run test`.
import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { rows, tools } from '../src/lib/compare';

const read = (f: string) => JSON.parse(readFileSync(join(import.meta.dir, f), 'utf8'));

test('every /compare row has one cell per tool', () => {
  // A row is [criterion, ...one cell per tool]; a missing cell would shift the
  // header off its column (the headers come from `tools`).
  for (const row of rows) {
    expect(row.length, `row "${row[0]}"`).toBe(tools.length + 1);
  }
});

// release-check runs the site against a local SDK checkout (OXFRAME_SDK_PATH)
// before the tag, when the new version cannot be on crates.io yet; as in
// scripts/crate-versions.ts, only a build of what is pushed must refuse.
test.skipIf(!!process.env.OXFRAME_SDK_PATH)(
  'the SDK version the site builds with is published',
  () => {
    // Docs must not get ahead of crates.io; the build also enforces this.
    const sdk = readFileSync(join(import.meta.dir, '../src/lib/sdk.ts'), 'utf8');
    const version = /SDK_VERSION\s*=\s*'([^']+)'/.exec(sdk)?.[1];
    expect(version, 'SDK_VERSION in sdk.ts').toBeTruthy();
    const published = (read('../src/lib/versions.json') as { versions: string[] }).versions;
    expect(published, `sdk.ts ${version} must be in versions.json`).toContain(version);
  },
);

test('every benchmarked /vs scene has a measurement', () => {
  const vs = read('../src/lib/vs-measurements.json') as Record<string, unknown>;
  // vs.ts scenes name a bench key; the key must exist with a render time.
  const vsSrc = readFileSync(join(import.meta.dir, '../src/lib/vs.ts'), 'utf8');
  for (const [, key] of vsSrc.matchAll(/bench:\s*'([^']+)'/g)) {
    const m = vs[key] as { seconds?: number } | undefined;
    expect(m, `bench key "${key}"`).toBeTruthy();
    expect(typeof m!.seconds, `${key}.seconds`).toBe('number');
  }
});
