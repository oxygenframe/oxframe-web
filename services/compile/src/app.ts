import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Config } from './config';
import { SDK_VERSION } from './config';
import { Metrics } from './metrics';
import { BuildQueue } from './queue';
import { RateLimiter } from './ratelimit';
import type { Runner } from './runner';
import { isJobId, jobId, type JobRecord, Store } from './store';
import { validateSource } from './validate';

export interface CompileResponse {
  id: string;
  status: JobRecord['status'];
  wasm_url: string | null;
  js_url: string | null;
  errors: JobRecord['errors'];
  log?: string;
  /** Infrastructure failure: not cached, retried on the next request. */
  transient?: true;
}

export interface Example {
  name: string;
  title: string;
  source: string;
  id: string;
  status: JobRecord['status'] | 'missing';
  wasm_url: string | null;
  js_url: string | null;
}

export function createApp(
  cfg: Config,
  runner: Runner,
  opts: { examplesDir?: string; clientIp?: (req: Request) => string } = {},
) {
  const store = new Store(cfg.dataDir);
  const metrics = new Metrics();
  const queue = new BuildQueue(store, runner, cfg.workers, cfg.queueLimit, metrics);
  const limiter = new RateLimiter(cfg.ratePerMinute);
  const app = new Hono();

  const respond = (rec: JobRecord): CompileResponse => ({
    id: rec.id,
    status: rec.status,
    wasm_url: rec.status === 'done' ? `${cfg.publicBase}/api/artifact/${rec.id}/bundle.wasm` : null,
    js_url: rec.status === 'done' ? `${cfg.publicBase}/api/artifact/${rec.id}/bundle.js` : null,
    errors: rec.errors,
    ...(rec.log ? { log: rec.log } : {}),
    ...(rec.transient ? { transient: true as const } : {}),
  });

  app.use(
    '/api/*',
    cors({
      origin: (o) => (cfg.corsOrigins.includes('*') || cfg.corsOrigins.includes(o) ? o : null),
      allowMethods: ['GET', 'POST'],
    }),
  );

  app.post('/api/compile', async (c) => {
    metrics.inc('oxframe_compile_requests_total');
    let body: { source?: unknown; sdk_version?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'expected JSON {source, sdk_version}' }, 400);
    }
    if (typeof body.source !== 'string') return c.json({ error: '`source` must be a string' }, 400);
    const sdk = typeof body.sdk_version === 'string' ? body.sdk_version : SDK_VERSION;
    if (sdk !== SDK_VERSION) {
      return c.json({ error: `this service builds with SDK ${SDK_VERSION}, not ${sdk}` }, 422);
    }
    const source = body.source;
    const id = jobId(source, sdk, cfg.buildId);
    const cached = store.get(id);
    if (cached && !cached.transient && (cached.status === 'done' || cached.status === 'error')) {
      metrics.inc('oxframe_cache_hits_total');
      return c.json(respond(cached));
    }
    const invalid = validateSource(source, cfg.maxSourceBytes);
    if (invalid.length) {
      metrics.inc('oxframe_rejected_total', { reason: 'validation' });
      return c.json(
        respond({ id, status: 'error', errors: invalid, sdkVersion: sdk, created: Date.now() }),
      );
    }
    if (!queue.inFlight(id)) {
      const ip =
        opts.clientIp?.(c.req.raw) ??
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
        'local';
      if (queue.isFull()) {
        metrics.inc('oxframe_rejected_total', { reason: 'queue_full' });
        return c.json({ error: 'the build queue is full; try again in a moment' }, 429, {
          'Retry-After': '10',
        });
      }
      // Docs embeds build the site's own examples on demand: a known,
      // bounded set that is cached once built, so it does not count
      // against the visitor's own builds.
      const isExample = () => examples().some((e) => e.id === id);
      if (!isExample() && !limiter.take(ip)) {
        metrics.inc('oxframe_rejected_total', { reason: 'rate_limit' });
        return c.json({ error: `at most ${cfg.ratePerMinute} builds per minute` }, 429, {
          'Retry-After': String(limiter.retryAfterSeconds(ip)),
        });
      }
    }
    const build = queue.submit(id, source, sdk);
    // Wait up to the build timeout; otherwise the client polls by id.
    const waited = await Promise.race([build, Bun.sleep(cfg.timeoutMs).then(() => null)]);
    return c.json(respond(waited ?? store.get(id)!));
  });

  app.get('/api/compile/:id', (c) => {
    const id = c.req.param('id');
    const rec = isJobId(id) ? store.get(id) : null;
    return rec ? c.json(respond(rec)) : c.json({ error: 'unknown id' }, 404);
  });

  app.get('/api/artifact/:id/:file', (c) => {
    const id = c.req.param('id');
    const file = c.req.param('file');
    if (!isJobId(id) || (file !== 'bundle.wasm' && file !== 'bundle.js')) return c.notFound();
    const rec = store.get(id);
    if (rec?.status !== 'done') return c.notFound();
    const headers: Record<string, string> = {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': '*',
      'Content-Type':
        file === 'bundle.wasm' ? 'application/wasm' : 'text/javascript; charset=utf-8',
    };
    if (
      file === 'bundle.wasm' &&
      (c.req.header('accept-encoding') ?? '').includes('br') &&
      existsSync(store.file(id, 'bundle.wasm.br'))
    ) {
      headers['Content-Encoding'] = 'br';
      headers.Vary = 'Accept-Encoding';
      return new Response(Bun.file(store.file(id, 'bundle.wasm.br')), { headers });
    }
    return new Response(Bun.file(store.file(id, file)), { headers });
  });

  const examples = (): Example[] => {
    const dir = opts.examplesDir;
    if (!dir || !existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => f.endsWith('.rs'))
      .sort()
      .map((f) => {
        const source = readFileSync(join(dir, f), 'utf8');
        const id = jobId(source, SDK_VERSION, cfg.buildId);
        let rec = store.get(id);
        // A build interrupted by a restart leaves a queued/building record
        // behind; with no job in the queue it would never finish.
        if (rec && (rec.status === 'queued' || rec.status === 'building') && !queue.inFlight(id))
          rec = null;
        const title = /^\/\/!\s*(.+)$/m.exec(source)?.[1] ?? f;
        return {
          name: f.replace(/\.rs$/, ''),
          title,
          source,
          id,
          status: rec?.status ?? 'missing',
          wasm_url: rec?.status === 'done' ? respond(rec).wasm_url : null,
          js_url: rec?.status === 'done' ? respond(rec).js_url : null,
        };
      });
  };

  // Runs a built scene for mcp.oxframe.dev: `check`, `frame` or `inspect`.
  // The caller sends the build's bundle.js and bundle.wasm (compile-cf keeps
  // them in R2), so this works on a machine that did not build them. The
  // scene runs as wasm in its own process with a time limit.
  let running = 0;
  app.post('/api/run', async (c) => {
    let form: FormData;
    try {
      form = await c.req.formData();
    } catch {
      return c.json({ error: 'expected multipart {op, at, js, wasm}' }, 400);
    }
    const op = form.get('op');
    const at = Number(form.get('at') ?? 0);
    const js = form.get('js');
    const wasm = form.get('wasm');
    if (op !== 'check' && op !== 'frame' && op !== 'inspect')
      return c.json({ error: '`op` is check, frame or inspect' }, 400);
    if (!Number.isFinite(at) || at < 0) return c.json({ error: '`at` is seconds, ≥ 0' }, 400);
    if (!(js instanceof Blob) || !(wasm instanceof Blob))
      return c.json({ error: '`js` and `wasm` are the build files' }, 400);
    if (js.size + wasm.size > cfg.maxArtifactBytes * 2)
      return c.json({ error: 'build files too large' }, 413);
    if (running >= cfg.workers) {
      metrics.inc('oxframe_rejected_total', { reason: 'run_busy' });
      return c.json({ error: 'busy; try again in a moment' }, 429, { 'Retry-After': '5' });
    }
    running++;
    const dir = mkdtempSync(join(cfg.dataDir, 'run-'));
    try {
      writeFileSync(join(dir, 'bundle.js'), new Uint8Array(await js.arrayBuffer()));
      writeFileSync(join(dir, 'bundle.wasm'), new Uint8Array(await wasm.arrayBuffer()));
      metrics.inc('oxframe_runs_total', { op });
      const out = await runOp(dir, op, at, cfg.runTimeoutMs);
      return c.json(out.body, out.status as 200);
    } finally {
      running--;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  app.get('/api/examples', (c) => c.json(examples()));
  app.get('/healthz', (c) => c.text('ok'));
  app.get('/metrics', (c) =>
    c.text(metrics.render(), 200, { 'Content-Type': 'text/plain; version=0.0.4' }),
  );

  /** Builds examples that are not cached yet (deploy step / startup). */
  async function prebuildExamples(): Promise<void> {
    for (const ex of examples()) {
      const rec = store.get(ex.id);
      if (ex.status === 'missing' || rec?.transient)
        await queue.submit(ex.id, ex.source, SDK_VERSION);
    }
  }

  return { app, store, queue, metrics, prebuildExamples };
}

/** Runs scene-run.ts on `dir` in a child process; kills it after `timeoutMs`. */
async function runOp(
  dir: string,
  op: string,
  at: number,
  timeoutMs: number,
): Promise<{ status: number; body: unknown }> {
  const proc = Bun.spawn(
    [process.execPath, join(import.meta.dir, 'scene-run.ts'), dir, op, String(at)],
    {
      cwd: dir,
      env: { PATH: process.env.PATH ?? '' },
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );
  const timer = setTimeout(() => proc.kill(9), timeoutMs);
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  clearTimeout(timer);
  if (proc.signalCode)
    return {
      status: 200,
      body: { error: `the scene did not finish within ${timeoutMs / 1000} s` },
    };
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(stdout) as Record<string, unknown>;
  } catch {
    return { status: 500, body: { error: `run failed (exit ${code}): ${stderr.slice(-1000)}` } };
  }
  // A panic: its message is on stderr ("panicked at src/scene.rs:…").
  if (body.error && stderr.trim()) body.log = stderr.trim().slice(-2000);
  return { status: 200, body };
}
