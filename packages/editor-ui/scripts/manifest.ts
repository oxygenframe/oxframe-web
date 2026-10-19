// Writes dist/manifest.json, read by `oxframe check` to compare protocol
// versions, and prints the gzip size budget check (≤ 2 MB, spec §8).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import pkg from '../package.json' with { type: 'json' };

const PROTOCOL_VERSION = 1;
const dist = join(import.meta.dir, '../dist');
writeFileSync(
  join(dist, 'manifest.json'),
  JSON.stringify(
    { name: 'editor-ui', version: pkg.version, protocol_version: PROTOCOL_VERSION },
    null,
    2,
  ) + '\n',
);

let total = 0;
for (const f of readdirSync(dist)) {
  const p = join(dist, f);
  if (!statSync(p).isFile()) continue;
  const gz = gzipSync(readFileSync(p)).byteLength;
  total += gz;
  console.log(`${f.padEnd(24)} ${(gz / 1024).toFixed(1).padStart(8)} KiB gz`);
}
const budget = 2 * 1024 * 1024;
console.log(`total ${(total / 1024).toFixed(1)} KiB gz (budget ${budget / 1024} KiB)`);
if (total > budget) {
  console.error('editor-ui exceeds the 2 MB gzip budget');
  process.exit(1);
}
