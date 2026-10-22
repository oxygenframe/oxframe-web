import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (file: string) => JSON.parse(readFileSync(join(import.meta.dir, file), 'utf8'));
const data = read('../src/lib/measurements.json') as {
  version: string;
  editSeconds: number;
  checkWarmSeconds: number;
  checkAfterEditSeconds: number;
  render30Seconds: number;
  render30OneJobSeconds: number;
  render30SameBytes: boolean;
  a7: unknown;
};
const published = (read('../src/lib/versions.json') as { versions: string[] }).versions;

test('the recorded run is a published oxframe and has no agent pass rate', () => {
  expect(published).toContain(data.version);
  for (const seconds of [
    data.editSeconds,
    data.checkWarmSeconds,
    data.checkAfterEditSeconds,
    data.render30Seconds,
    data.render30OneJobSeconds,
  ])
    expect(seconds).toBeGreaterThan(0);
  expect(typeof data.render30SameBytes).toBe('boolean');
  expect(data.a7).toBeNull();
});
