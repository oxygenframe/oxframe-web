import { readdirSync, statSync } from 'node:fs';
import { cpus } from 'node:os';
import { join, resolve } from 'node:path';
import { SDK_VERSION as SITE_SDK_VERSION } from '../../../apps/site/src/lib/sdk';

const env = (k: string, d: string) => process.env[k] ?? d;
const num = (k: string, d: number) => Number(process.env[k] ?? d);

export const SDK_VERSION = env('OXFRAME_SDK_VERSION', SITE_SDK_VERSION);

export interface Config {
  port: number;
  host: string;
  dataDir: string;
  /** Where artifacts are served from (a CDN in production). */
  publicBase: string;
  runner: 'docker' | 'local';
  /** Local runner: how the template depends on the SDK (path or version). */
  oxframeDep: string;
  /** Docker runner: sandbox image and OCI runtime. */
  image: string;
  runtime: string;
  workers: number;
  queueLimit: number;
  ratePerMinute: number;
  timeoutMs: number;
  /** Longest a scene may run for /api/run. */
  runTimeoutMs: number;
  maxSourceBytes: number;
  maxArtifactBytes: number;
  corsOrigins: string[];
  toolsDir: string;
  /** Identity of the engine build, part of every cache key: the sandbox
   *  image digest in production; derived from SDK sources locally. */
  buildId: string;
}

export function loadConfig(): Config {
  const root = resolve(import.meta.dir, '..');
  const sdkPath = process.env.OXFRAME_SDK_PATH ?? resolve(root, '../../../oxframe-sdk');
  return {
    port: num('PORT', 8787),
    host: env('HOST', '127.0.0.1'),
    dataDir: env('DATA_DIR', join(root, '.data')),
    publicBase: env('PUBLIC_BASE', `http://127.0.0.1:${num('PORT', 8787)}`),
    runner: env('RUNNER', 'docker') === 'local' ? 'local' : 'docker',
    oxframeDep: env('OXFRAME_DEP', `path = ${JSON.stringify(join(sdkPath, 'crates/oxframe'))}`),
    image: env('SANDBOX_IMAGE', `oxframe-sandbox:${SDK_VERSION}`),
    runtime: env('SANDBOX_RUNTIME', 'runsc'),
    workers: num('WORKERS', Math.max(1, Math.floor(cpus().length / 2))),
    queueLimit: num('QUEUE_LIMIT', 32),
    ratePerMinute: num('RATE_PER_MINUTE', 10),
    timeoutMs: num('BUILD_TIMEOUT_MS', 60_000),
    runTimeoutMs: num('RUN_TIMEOUT_MS', 30_000),
    maxSourceBytes: 64 * 1024,
    maxArtifactBytes: 16 * 1024 * 1024,
    corsOrigins: env(
      'CORS_ORIGINS',
      'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173',
    ).split(','),
    toolsDir: env('TOOLS_DIR', resolve(root, '../../.tools/bin')),
    buildId:
      process.env.OXFRAME_BUILD_ID ??
      (env('RUNNER', 'docker') === 'local'
        ? `${sourceStamp(join(sdkPath, 'crates'))}-${sourceStamp(resolve(root, '../../infra/sandbox/template'))}`
        : SDK_VERSION),
  };
}

/** Newest mtime under a directory: changes whenever SDK sources change. */
function sourceStamp(dir: string): string {
  let newest = 0;
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else newest = Math.max(newest, statSync(p).mtimeMs);
    }
  };
  try {
    walk(dir);
  } catch {
    return 'local';
  }
  return `local-${Math.floor(newest)}`;
}
