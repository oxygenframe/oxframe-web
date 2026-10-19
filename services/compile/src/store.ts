import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidationError } from './validate';

export type Status = 'queued' | 'building' | 'done' | 'error';

export interface JobRecord {
  id: string;
  status: Status;
  errors: ValidationError[];
  /** Plain compiler output for the editor's error overlay. */
  log?: string;
  sdkVersion: string;
  /** Infrastructure failure: retried on the next request instead of cached. */
  transient?: boolean;
  created: number;
  finished?: number;
  wasmBytes?: number;
}

/** Cache key: same source + SDK + flags → same artifact (or same errors). */
export function jobId(source: string, sdkVersion: string, flags = ''): string {
  return createHash('sha256')
    .update(source)
    .update('\0')
    .update(sdkVersion)
    .update('\0')
    .update(flags)
    .digest('hex')
    .slice(0, 32);
}

export const isJobId = (s: string) => /^[0-9a-f]{32}$/.test(s);

/** Artifacts on disk: <data>/artifacts/<id>/{record.json, bundle.js, bundle.wasm, bundle.wasm.br}. */
export class Store {
  readonly root: string;
  constructor(dataDir: string) {
    this.root = join(dataDir, 'artifacts');
    mkdirSync(this.root, { recursive: true });
  }

  dir(id: string): string {
    return join(this.root, id);
  }

  get(id: string): JobRecord | null {
    const p = join(this.dir(id), 'record.json');
    if (!existsSync(p)) return null;
    try {
      return JSON.parse(readFileSync(p, 'utf8')) as JobRecord;
    } catch {
      return null;
    }
  }

  put(rec: JobRecord): void {
    mkdirSync(this.dir(rec.id), { recursive: true });
    const p = join(this.dir(rec.id), 'record.json');
    writeFileSync(`${p}.tmp`, JSON.stringify(rec));
    renameSync(`${p}.tmp`, p);
  }

  file(id: string, name: 'bundle.js' | 'bundle.wasm' | 'bundle.wasm.br' | 'source.rs'): string {
    return join(this.dir(id), name);
  }
}
