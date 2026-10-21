// Copies the SDK examples that work as playground scenes (each defines
// `pub fn project()`) into the site. In CI this runs against the oxframe-sdk
// release tag pinned in package.json, so docs never drift from the code.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  'camera',
  'code_steps',
  'svg',
  'transitions',
  'release',
  'components',
  'relative',
  'theme',
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
/** Drop `#[cfg(test)]` modules. They guard the SDK example, not the scene a visitor edits. */
export function sceneSource(source: string): string {
  const at = source.search(/^#\[cfg\(test\)\]/m);
  if (at === -1) return source;
  return source.slice(0, at).trimEnd() + '\n';
}

for (const n of names) {
  const from = join(sdk, 'examples/src', `${n}.rs`);
  if (!existsSync(from)) throw new Error(`missing ${from}`);
  writeFileSync(join(to, `${n}.rs`), sceneSource(readFileSync(from, 'utf8')));
}
console.log(`synced ${names.length} examples from ${sdk}`);
