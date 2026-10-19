// Copies the SDK examples that work as playground scenes (each defines
// `pub fn project()`) into the site. In CI this runs against the oxframe-sdk
// release tag pinned in package.json, so docs never drift from the code.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const sdk = process.env.OXFRAME_SDK_PATH ?? join(import.meta.dir, '../../oxframe-sdk');
const to = join(import.meta.dir, '../apps/site/src/lib/examples');
mkdirSync(to, { recursive: true });
const names = [
  'intro',
  'text',
  'morph',
  'layout',
  'chart',
  'particles',
  'showcase',
  'effects',
  'shapes',
  'typography',
  'quicksort',
  // Guide lessons (docs only, not in the gallery).
  'learn_01_hello',
  'learn_02_together',
  'learn_03_shapes',
  'learn_04_easing',
  'learn_05_text',
  'learn_06_groups',
  'learn_07_editor',
  'learn_08_signals',
  'learn_09_drawing',
  'learn_10_random',
];
for (const n of names) {
  const from = join(sdk, 'examples/src', `${n}.rs`);
  if (!existsSync(from)) throw new Error(`missing ${from}`);
  copyFileSync(from, join(to, `${n}.rs`));
}
console.log(`synced ${names.length} examples from ${sdk}`);
