import { resolve } from 'node:path';
import { createApp } from './app';
import { loadConfig } from './config';
import { DockerRunner, LocalRunner, type Runner } from './runner';

const cfg = loadConfig();
if (cfg.runner === 'local') {
  console.warn(
    '⚠ RUNNER=local compiles untrusted code WITHOUT a sandbox. Use it only for local development.',
  );
  if (cfg.host !== '127.0.0.1' && cfg.host !== 'localhost' && !process.env.ALLOW_UNSANDBOXED) {
    console.error(
      'refusing to listen on a public address with RUNNER=local (set ALLOW_UNSANDBOXED=1 to override)',
    );
    process.exit(2);
  }
}
const runner: Runner = cfg.runner === 'local' ? new LocalRunner(cfg) : new DockerRunner(cfg);
const examplesDir =
  process.env.EXAMPLES_DIR ?? resolve(import.meta.dir, '../../../apps/site/src/lib/examples');
const { app, prebuildExamples } = createApp(cfg, runner, { examplesDir });

if (runner.warm) {
  console.log(`warming ${cfg.workers} worker(s)…`);
  await Promise.all(Array.from({ length: cfg.workers }, (_, i) => runner.warm!(i)));
}
void prebuildExamples().then(() => console.log('examples built'));

Bun.serve({ port: cfg.port, hostname: cfg.host, fetch: app.fetch, idleTimeout: 120 });
console.log(
  `compile-service on http://${cfg.host}:${cfg.port} (runner: ${cfg.runner}, workers: ${cfg.workers})`,
);
