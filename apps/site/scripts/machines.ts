// The timings of scripts/measure.sh on GitHub's runners (oxframe-sdk,
// .github/workflows/measure.yml) into src/lib/measurements.json, for the
// "Other machines" table on /benchmarks.
//
//   bun scripts/machines.ts <run id>     # gh run list -R oxygenframe/oxframe-sdk -w measure
//
// Needs the GitHub CLI, logged in. Keeps the machines a run lacks.
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = process.argv[2];
if (!run || !/^\d+$/.test(run)) {
  console.error('usage: bun scripts/machines.ts <run id>');
  process.exit(2);
}
const dir = mkdtempSync(join(tmpdir(), 'oxframe-machines-'));
const got = Bun.spawnSync(
  ['gh', 'run', 'download', run, '-R', 'oxygenframe/oxframe-sdk', '-D', dir],
  { stdout: 'inherit', stderr: 'inherit' },
);
if (got.exitCode !== 0) process.exit(got.exitCode ?? 1);

type Machine = {
  name: string;
  machine: string;
  version: string;
  date: string;
  checkWarmSeconds: number;
  render30Seconds: number;
  render30OneJobSeconds: number;
  render30Jobs: number;
  render30VideoSeconds: number;
};
const file = new URL('../src/lib/measurements.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const machines: Machine[] = data.machines ?? [];
for (const artifact of readdirSync(dir)) {
  const name = artifact.replace(/^measure-/, '');
  const m = JSON.parse(readFileSync(join(dir, artifact, `${artifact}.json`), 'utf8'));
  const row: Machine = {
    name,
    machine: m.machine,
    version: m.version,
    date: m.date,
    checkWarmSeconds: m.checkWarmSeconds,
    render30Seconds: m.render30Seconds,
    render30OneJobSeconds: m.render30OneJobSeconds,
    render30Jobs: m.render30Jobs,
    render30VideoSeconds: m.render30VideoSeconds,
  };
  const i = machines.findIndex((x) => x.name === name);
  if (i >= 0) machines[i] = row;
  else machines.push(row);
  console.log(`${name}: ${row.render30Seconds}s render, ${row.machine}`);
}
machines.sort((a, b) => a.name.localeCompare(b.name));
data.machines = machines;
data.machinesRun = `https://github.com/oxygenframe/oxframe-sdk/actions/runs/${run}`;
writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
rmSync(dir, { recursive: true });
