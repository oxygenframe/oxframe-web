// Fails the build when /changelog has no entry for the SDK the site is built
// on: src/lib/changelog.json is written by `bun run sync-examples`, and a
// version bump committed without it leaves the page a release behind.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SDK_VERSION } from '../src/lib/sdk';

const entries = JSON.parse(
  readFileSync(join(import.meta.dir, '../src/lib/changelog.json'), 'utf8'),
) as { version: string }[];
if (!entries.some((e) => e.version === SDK_VERSION)) {
  console.error(
    `src/lib/changelog.json has no entry for oxframe ${SDK_VERSION} (src/lib/sdk.ts). Run \`bun run sync-examples\` against that SDK release and commit the result.`,
  );
  process.exit(1);
}
