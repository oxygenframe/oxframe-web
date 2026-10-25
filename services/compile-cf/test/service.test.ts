// The Worker logic against the real services/compile app (as the container)
// with a fake runner and an in-memory bucket.
import { describe, expect, it } from 'bun:test';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../../compile/src/app';
import { SDK_VERSION } from '../../compile/src/config';
import type { Config } from '../../compile/src/config';
import type { Runner } from '../../compile/src/runner';
import { jobId as storeJobId } from '../../compile/src/store';
import { type Bucket, createService, type Example, jobId } from '../src/service';

const GOOD = 'use oxframe::prelude::*;\npub fn project() -> Project { Project::new("x") }\n';
const BUILD_ID = 'img-1';

class FakeRunner implements Runner {
  builds = 0;
  transient = false;
  async build(source: string, outDir: string) {
    this.builds++;
    if (this.transient) {
      return {
        ok: false,
        transient: true,
        errors: [{ file: 'scene.rs', line: 1, column: 1, message: 'internal' }],
        log: '',
      };
    }
    if (source.includes('fail!')) {
      return {
        ok: false,
        errors: [{ file: 'scene.rs', line: 2, column: 5, message: 'cannot find macro `fail`' }],
        log: 'error: …',
      };
    }
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'bundle.wasm'), new Uint8Array([0, 97, 115, 109]));
    // The exports scene-run.ts calls, in plain JS.
    writeFileSync(
      join(outDir, 'bundle.js'),
      `export default async () => {};
export const check = () => ({ report: '{"issues":[]}', storyboard: new Uint8Array([1]) });`,
    );
    return {
      ok: true,
      errors: [],
      log: '',
      js: join(outDir, 'bundle.js'),
      wasm: join(outDir, 'bundle.wasm'),
    };
  }
}

class MemoryBucket implements Bucket {
  objects = new Map<string, Uint8Array>();
  async get(key: string) {
    const v = this.objects.get(key);
    if (!v) return null;
    return {
      body: new Response(v).body!,
      text: async () => new TextDecoder().decode(v),
    };
  }
  async put(key: string, value: ArrayBuffer | string) {
    this.objects.set(
      key,
      typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value),
    );
  }
}

function setup(over: { examples?: Example[]; allow?: boolean; staleMachine?: boolean } = {}) {
  const cfg: Config = {
    port: 0,
    host: '127.0.0.1',
    dataDir: mkdtempSync(join(tmpdir(), 'compile-cf-')),
    publicBase: 'http://container',
    runner: 'local',
    oxframeDep: `version = "${SDK_VERSION}"`,
    image: 'x',
    runtime: 'runsc',
    workers: 1,
    queueLimit: 4,
    ratePerMinute: 1000,
    timeoutMs: 5_000,
    runTimeoutMs: 5_000,
    maxSourceBytes: 64 * 1024,
    maxArtifactBytes: 16 * 1024 * 1024,
    corsOrigins: ['*'],
    toolsDir: '/nonexistent',
    buildId: BUILD_ID,
  };
  const runner = new FakeRunner();
  const container = createApp(cfg, runner).app;
  const bucket = new MemoryBucket();
  const calls: string[] = [];
  let stale = over.staleMachine ?? false;
  const svc = createService({
    bucket,
    container: async (_key, req) => {
      calls.push(`${req.method} ${new URL(req.url).pathname}`);
      // A machine still on the previous image refuses this SDK version.
      if (stale)
        return Response.json(
          { error: 'this service builds with SDK 0.0.1, not x' },
          { status: 422 },
        );
      return container.fetch(req);
    },
    restartContainer: async () => {
      calls.push('restart');
      stale = false;
      // Like a real Durable Object reset: the call that destroys it fails.
      throw new Error('Durable Object reset');
    },
    allowBuild: async () => over.allow ?? true,
    examples: over.examples ?? [],
    // The container app builds the site's SDK version; the Worker must agree.
    sdkVersion: SDK_VERSION,
    buildId: BUILD_ID,
    corsOrigins: ['https://oxframe.dev'],
  });
  return { svc, runner, bucket, calls };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const body = async (r: Response | Promise<Response>): Promise<any> => (await r).json();

const compile = (svc: ReturnType<typeof setup>['svc'], source: string, origin?: string) =>
  svc.fetch(
    new Request('https://compile.oxframe.dev/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
      body: JSON.stringify({ source }),
    }),
  );

describe('compile worker', () => {
  it('computes the same job id as the container', async () => {
    expect(await jobId(GOOD, SDK_VERSION, BUILD_ID)).toBe(storeJobId(GOOD, SDK_VERSION, BUILD_ID));
  });

  it('builds once, then serves from R2 without waking a container', async () => {
    const { svc, runner, bucket, calls } = setup();
    const first = await body(compile(svc, GOOD));
    expect(first.status).toBe('done');
    expect(first.wasm_url).toBe(`https://compile.oxframe.dev/api/artifact/${first.id}/bundle.wasm`);
    expect(runner.builds).toBe(1);
    expect([...bucket.objects.keys()].sort()).toEqual(
      ['bundle.js', 'bundle.wasm', 'bundle.wasm.gz', 'record.json'].map(
        (f) => `compile/v1/${first.id}/${f}`,
      ),
    );

    calls.length = 0;
    const again = await body(compile(svc, GOOD));
    expect(again).toEqual(first);
    expect(calls).toEqual([]);

    const wasm = await svc.fetch(new Request(first.wasm_url));
    expect(wasm.headers.get('Content-Type')).toBe('application/wasm');
    expect(wasm.headers.get('Cache-Control')).toContain('immutable');
    expect(new Uint8Array(await wasm.arrayBuffer())).toEqual(new Uint8Array([0, 97, 115, 109]));
  });

  it('caches compile errors but not infrastructure failures', async () => {
    const { svc, runner } = setup();
    const bad = await body(compile(svc, GOOD + 'fail!();'));
    expect(bad.status).toBe('error');
    expect(bad.errors[0].line).toBe(2);
    await compile(svc, GOOD + 'fail!();');
    expect(runner.builds).toBe(1);

    runner.transient = true;
    await compile(svc, GOOD + '// flaky');
    runner.transient = false;
    const retried = await body(compile(svc, GOOD + '// flaky'));
    expect(retried.status).toBe('done');
    expect(runner.builds).toBe(3);
  });

  it('rejects invalid sources and rate-limited callers before building', async () => {
    const { svc, runner } = setup({ allow: false });
    const invalid = await body(compile(svc, '#![no_std]\n' + GOOD));
    expect(invalid.status).toBe('error');
    expect((await compile(svc, GOOD)).status).toBe(429);
    expect(runner.builds).toBe(0);
  });

  it('replaces a machine that still runs the previous image', async () => {
    const { svc, calls } = setup({ staleMachine: true });
    expect((await body(compile(svc, GOOD))).status).toBe('done');
    expect(calls.slice(0, 3)).toEqual(['POST /api/compile', 'restart', 'POST /api/compile']);
  });

  it('does not rate-limit building the site examples', async () => {
    const { svc, runner } = setup({
      allow: false,
      examples: [{ name: 'hello', title: 'Hello', source: GOOD }],
    });
    expect((await body(compile(svc, GOOD))).status).toBe('done');
    expect((await compile(svc, GOOD + '//other')).status).toBe(429);
    expect(runner.builds).toBe(1);
  });

  it('lists examples with their status and prebuilds the missing ones', async () => {
    const examples = [
      { name: 'hello', title: 'Hello', source: GOOD },
      { name: 'broken', title: 'Broken', source: GOOD + 'fail!();' },
    ];
    const { svc, runner } = setup({ examples });
    const list = async () =>
      (await body(svc.fetch(new Request('https://c.dev/api/examples')))) as Array<{
        name: string;
        status: string;
        wasm_url: string | null;
      }>;
    expect((await list()).map((e) => e.status)).toEqual(['missing', 'missing']);
    expect(await svc.prebuild()).toEqual(['hello: done', 'broken: error']);
    const after = await list();
    expect(after.map((e) => e.status)).toEqual(['done', 'error']);
    expect(after[0]!.wasm_url).toStartWith('https://c.dev/api/artifact/');
    expect(await svc.prebuild()).toEqual([]);
    expect(runner.builds).toBe(2);
  });

  it('answers CORS only for allowed origins', async () => {
    const { svc } = setup();
    const ok = await compile(svc, GOOD, 'https://oxframe.dev');
    expect(ok.headers.get('Access-Control-Allow-Origin')).toBe('https://oxframe.dev');
    const other = await compile(svc, GOOD, 'https://evil.example');
    expect(other.headers.get('Access-Control-Allow-Origin')).toBeNull();
    const pre = await svc.fetch(
      new Request('https://c.dev/api/compile', {
        method: 'OPTIONS',
        headers: { Origin: 'https://oxframe.dev' },
      }),
    );
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('lets any site read the examples list (<oxframe-player example>)', async () => {
    const { svc } = setup();
    const res = await svc.fetch(
      new Request('https://c.dev/api/examples', { headers: { Origin: 'https://blog.example' } }),
    );
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://blog.example');
  });

  it('404s for unknown artifacts and ids', async () => {
    const { svc } = setup();
    const id = 'a'.repeat(32);
    expect(
      (await svc.fetch(new Request(`https://c.dev/api/artifact/${id}/bundle.wasm`))).status,
    ).toBe(404);
    expect(
      (await svc.fetch(new Request(`https://c.dev/api/artifact/${id}/secret.txt`))).status,
    ).toBe(404);
    expect((await svc.fetch(new Request('https://c.dev/api/compile/nope'))).status).toBe(404);
  });
});

describe('run', () => {
  const run = (svc: ReturnType<typeof setup>['svc'], id: string, op = 'check') =>
    svc.fetch(
      new Request('https://compile.oxframe.dev/api/run', {
        method: 'POST',
        body: JSON.stringify({ id, op }),
      }),
    );

  it('runs a build from R2 once, then answers from R2', async () => {
    const { svc, bucket, calls } = setup();
    const { id } = await body(compile(svc, GOOD));
    calls.length = 0;
    expect(await body(run(svc, id))).toEqual({ report: { issues: [] }, storyboard_png: 'AQ==' });
    expect(calls).toEqual(['POST /api/run']);
    expect(bucket.objects.has(`compile/v1/${id}/run-check.json`)).toBe(true);
    calls.length = 0;
    expect((await body(run(svc, id))).storyboard_png).toBe('AQ==');
    expect(calls).toEqual([]);
  });

  it('needs a finished build and a known op', async () => {
    const { svc } = setup();
    expect((await run(svc, 'f'.repeat(32))).status).toBe(404);
    const { id } = await body(compile(svc, GOOD));
    expect((await run(svc, id, 'render')).status).toBe(400);
  });
});

describe('artifacts', () => {
  it('serves wasm gzipped to clients that accept it', async () => {
    const { svc } = setup();
    const { wasm_url } = await body(compile(svc, GOOD));
    const gz = await svc.fetch(
      new Request(wasm_url, { headers: { 'Accept-Encoding': 'gzip, br' } }),
    );
    expect(gz.headers.get('Content-Encoding')).toBe('gzip');
    const raw = new Uint8Array(
      await new Response(gz.body!.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),
    );
    expect(raw).toEqual(new Uint8Array([0, 97, 115, 109]));
    const plain = await svc.fetch(new Request(wasm_url));
    expect(plain.headers.get('Content-Encoding')).toBeNull();
  });
});
