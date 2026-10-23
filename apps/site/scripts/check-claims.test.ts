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

test('the recorded run is a published oxframe with a sane agent pass rate', () => {
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
  // a7 is null until a run is recorded; once set, the rates must be sane.
  const a7 = data.a7 as {
    prompts: number;
    passed: number;
    passRate: number;
    buildRate: number;
  } | null;
  expect(a7).not.toBeNull();
  expect(a7!.prompts).toBeGreaterThan(0);
  expect(a7!.passed).toBeGreaterThanOrEqual(0);
  expect(a7!.passed).toBeLessThanOrEqual(a7!.prompts);
  expect(a7!.passRate).toBeGreaterThan(0);
  expect(a7!.passRate).toBeLessThanOrEqual(1);
  expect(a7!.buildRate).toBeGreaterThan(0);
  expect(a7!.buildRate).toBeLessThanOrEqual(1);
});
