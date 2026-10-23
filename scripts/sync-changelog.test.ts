import { expect, test } from 'bun:test';
import { releases } from './sync-changelog';

test('released versions are kept and Unreleased is left out', async () => {
  const list = await releases(`# Changelog

Intro.

## Unreleased

### Added

- Not out yet.

## 0.21.0 — 2026-10-23

### Added

- \`Math\`.
`);
  expect(list.map((r) => r.version)).toEqual(['0.21.0']);
  expect(list[0]!.date).toBe('2026-10-23');
  expect(list[0]!.html).toContain('Math');
});

test('a heading that is neither a release nor Unreleased is an error', async () => {
  expect(releases('## Next\n- x\n')).rejects.toThrow('changelog heading not understood');
});
