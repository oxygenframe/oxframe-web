// `bun run dev`: compile-service (local runner, no sandbox) + site (Vite)
// together, with prefixed output; Ctrl+C stops both.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const tools = join(root, '.tools/bin');
if (!existsSync(join(tools, 'wasm-bindgen')) || !existsSync(join(tools, 'wasm-opt'))) {
  console.error('wasm tools missing: run ./scripts/install-wasm-tools.sh first');
  process.exit(1);
}

const procs = [
  {
    name: 'compile',
    color: 35,
    cmd: ['bun', '--watch', 'src/index.ts'],
    cwd: join(root, 'services/compile'),
    env: {
      RUNNER: 'local',
      WORKERS: process.env.WORKERS ?? '1',
      // The dev site, and the built site under `bun serve.ts` / e2e.
      CORS_ORIGINS:
        'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173',
    },
  },
  { name: 'site', color: 36, cmd: ['bun', 'run', 'dev'], cwd: join(root, 'apps/site'), env: {} },
].map((p) => {
  const child = Bun.spawn(p.cmd, {
    cwd: p.cwd,
    env: { ...process.env, ...p.env, FORCE_COLOR: '1' },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const prefix = `\x1b[${p.color}m[${p.name}]\x1b[0m `;
  for (const stream of [child.stdout, child.stderr]) {
    void (async () => {
      const decoder = new TextDecoder();
      let buf = '';
      for await (const chunk of stream) {
        buf += decoder.decode(chunk, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const l of lines) console.log(prefix + l);
      }
    })();
  }
  void child.exited.then((code) => {
    console.log(`${prefix}exited with ${code}`);
    shutdown(code ?? 1);
  });
  return child;
});

let stopping = false;
function shutdown(code: number) {
  if (stopping) return;
  stopping = true;
  for (const p of procs) p.kill();
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
console.log(
  'playground: http://localhost:5173/playground  (compile-service: http://127.0.0.1:8787)',
);
