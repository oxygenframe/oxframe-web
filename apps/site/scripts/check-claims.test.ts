import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const data = JSON.parse(
  readFileSync(join(import.meta.dir, '../src/lib/measurements.json'), 'utf8'),
) as { editSeconds: number; checkWarmSeconds: number; a7: unknown; version: string };

test('the recorded run is oxframe 0.4.0 and has no agent pass rate', () => {
  expect(data.version).toBe('0.4.0');
  expect(data.editSeconds).toBeGreaterThan(0);
  expect(data.checkWarmSeconds).toBeGreaterThan(0);
  expect(data.a7).toBeNull();
});
