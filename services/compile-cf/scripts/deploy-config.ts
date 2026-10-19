// Writes wrangler.deploy.json: wrangler.jsonc with the container image
// pointing at the Cloudflare registry instead of the Dockerfile, so the
// deploy itself needs no Docker. The image is built and pushed by
// .github/workflows/deploy-compile.yml under the tag BUILD_ID (run `gen`
// first).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILD_ID } from '../src/examples.gen';

export const IMAGE_NAME = 'oxframe-compile-builder';

const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!account) throw new Error('set CLOUDFLARE_ACCOUNT_ID');

const dir = join(import.meta.dir, '..');
// wrangler.jsonc uses whole-line comments and trailing commas only.
const text = readFileSync(join(dir, 'wrangler.jsonc'), 'utf8')
  .split('\n')
  .filter((l) => !/^\s*\/\//.test(l))
  .join('\n')
  .replace(/,(\s*[}\]])/g, '$1');
const config = JSON.parse(text) as {
  $schema?: string;
  containers: Array<{ image: string; image_build_context?: string }>;
};
for (const c of config.containers) {
  c.image = `registry.cloudflare.com/${account}/${IMAGE_NAME}:${BUILD_ID}`;
  delete c.image_build_context;
}
delete config.$schema;
writeFileSync(join(dir, 'wrangler.deploy.json'), `${JSON.stringify(config, null, 2)}\n`);
console.log(`wrangler.deploy.json → ${config.containers[0]!.image}`);
