// Copies the changelog of oxframe-sdk (CHANGELOG.md) into the site as
// src/lib/changelog.json: one entry per version with its date and the notes
// as HTML, for /changelog. Run with sync-examples.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { markdown } from './sync-skills';

const sdk = process.env.OXFRAME_SDK_PATH ?? join(import.meta.dir, '../../oxframe-sdk');
const out = join(import.meta.dir, '../apps/site/src/lib/changelog.json');

export interface Release {
  version: string;
  date: string;
  html: string;
}

/** `## 0.20.1 — 2026-10-22` sections of a changelog, newest first as written. */
export async function releases(text: string): Promise<Release[]> {
  const parts = text.split(/^## /m).slice(1);
  const list: Release[] = [];
  for (const part of parts) {
    const [head, ...body] = part.split('\n');
    // Merged but not released: /changelog lists releases only.
    if (/^Unreleased\s*$/.test(head!)) continue;
    const m = /^(\d+\.\d+\.\d+)\s+—\s+(\d{4}-\d{2}-\d{2})/.exec(head!);
    if (!m) throw new Error(`changelog heading not understood: ## ${head}`);
    // `### Added` sits under the version's h2 on the page.
    list.push({ version: m[1]!, date: m[2]!, html: await markdown(body.join('\n'), 0) });
  }
  return list;
}

if (import.meta.main) {
  const list = await releases(readFileSync(join(sdk, 'CHANGELOG.md'), 'utf8'));
  writeFileSync(out, JSON.stringify(list, null, 2) + '\n');
  console.log(`synced ${list.length} releases of the changelog`);
}
