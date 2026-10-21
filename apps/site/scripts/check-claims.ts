// Timings on the marketing pages come from src/lib/measurements.json.
// The homepage binds those fields. It must not also hardcode them, and no
// page may invent an agent pass rate while `a7` is null.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const site = join(import.meta.dir, '..');
const data = JSON.parse(readFileSync(join(site, 'src/lib/measurements.json'), 'utf8')) as {
  version: string;
  date: string;
  editSeconds: number;
  checkWarmSeconds: number;
  checkAfterEditSeconds: number;
  render30Seconds: number;
  render30OneJobSeconds: number;
  render30SameBytes: boolean;
  a7: unknown;
};

const homePath = join(site, 'src/routes/+page.svelte');
const home = readFileSync(homePath, 'utf8');
for (const needle of [
  'measurements.editSeconds',
  'measurements.checkWarmSeconds',
  'measurements.checkAfterEditSeconds',
  'measurements.render30Seconds',
  'measurements.render30OneJobSeconds',
  'measurements.version',
  'measurements.date',
]) {
  if (!home.includes(needle)) fail(`homepage does not show ${needle}`);
}
for (const literal of [
  data.editSeconds,
  data.checkWarmSeconds,
  data.checkAfterEditSeconds,
  data.render30Seconds,
  data.render30OneJobSeconds,
].map(String)) {
  if (home.includes(literal)) fail(`homepage hardcodes ${literal}; bind measurements.json`);
}

const pages = svelteFiles(join(site, 'src/routes'));
for (const path of pages) {
  const text = readFileSync(path, 'utf8').replace(/<style[\s\S]*<\/style>/g, '');
  if (/\d+(?:\.\d+)?%/.test(text)) fail(`${path} contains a percentage`);
  if (data.a7 == null && /\d+(?:\.\d+)?\s*%|\baverage of \d+/i.test(text)) {
    fail(`${path} quotes an agent result, but a7 is null`);
  }
}
if (data.a7 == null && !home.includes('not been measured')) {
  fail('homepage should say the agent run has not been measured');
}
if (!data.version || !data.date) fail('measurements.json needs a version and a date');
if (!data.render30SameBytes && home.includes('byte for byte the same')) {
  fail('homepage says the parallel render is byte-identical, but the measurement says otherwise');
}

console.log(
  `claims ok: edit ${data.editSeconds}s, warm check ${data.checkWarmSeconds}s, oxframe ${data.version} (${data.date})`,
);

function svelteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === 'docs') continue;
    if (statSync(path).isDirectory()) out.push(...svelteFiles(path));
    else if (name.endsWith('.svelte')) out.push(path);
  }
  return out;
}

function fail(message: string): never {
  console.error(`check-claims: ${message}`);
  process.exit(1);
}
