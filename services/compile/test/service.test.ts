import { describe, expect, it } from 'bun:test';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app';
import { type Config, SDK_VERSION } from '../src/config';
import { RateLimiter } from '../src/ratelimit';
import { parseCargo, type Runner } from '../src/runner';
import { jobId } from '../src/store';
import { stripComments, validateSource } from '../src/validate';

const GOOD = 'use oxframe::prelude::*;\npub fn project() -> Project { Project::new("x") }\n';

function cfg(over: Partial<Config> = {}): Config {
  return {
    port: 0,
    host: '127.0.0.1',
    dataDir: mkdtempSync(join(tmpdir(), 'compile-test-')),
    publicBase: 'http://cdn.test',
    runner: 'local',
    oxframeDep: `version = "${SDK_VERSION}"`,
    image: 'x',
    runtime: 'runsc',
    workers: 1,
    queueLimit: 4,
    ratePerMinute: 10,
    timeoutMs: 5_000,
    maxSourceBytes: 64 * 1024,
    maxArtifactBytes: 16 * 1024 * 1024,
    corsOrigins: ['http://site.test'],
    toolsDir: '/nonexistent',
    buildId: 'test',
    ...over,
  };
}

/** Fake runner: "compiles" by writing fixed artifacts; fails on `fail!`. */
class FakeRunner implements Runner {
  builds = 0;
  delayMs = 0;
  async build(source: string, outDir: string) {
    this.builds++;
    if (this.delayMs) await Bun.sleep(this.delayMs);
    if (source.includes('fail!')) {
      return {
        ok: false,
        errors: [{ file: 'scene.rs', line: 2, column: 5, message: 'cannot find macro `fail`' }],
        log: 'error: …',
      };
    }
    const { mkdirSync } = await import('node:fs');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'bundle.wasm'), new Uint8Array([0, 97, 115, 109]));
    writeFileSync(join(outDir, 'bundle.js'), 'export default async () => {}');
    return {
      ok: true,
      errors: [],
      log: '',
      js: join(outDir, 'bundle.js'),
      wasm: join(outDir, 'bundle.wasm'),
    };
  }
}

const post = (
  app: { fetch: (r: Request) => Response | Promise<Response> },
  body: unknown,
  ip = '1.1.1.1',
) =>
  app.fetch(
    new Request('http://x/api/compile', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
  );

describe('validation', () => {
  it('accepts a normal scene', () => {
    expect(validateSource(GOOD, 65536)).toEqual([]);
  });
  it('rejects forbidden constructs with positions', () => {
    const e = validateSource('#![no_std]\n' + GOOD, 65536);
    expect(e[0]).toMatchObject({ line: 1, column: 1 });
    expect(validateSource('#![feature(x)]\n' + GOOD, 65536)).toHaveLength(1);
    expect(
      validateSource(GOOD + 'fn f(){ unsafe { core::arch::asm!("nop") } }', 65536)[0]?.message,
    ).toContain('assembly');
    expect(validateSource(GOOD + '#[wasm_bindgen] pub fn x(){}', 65536)[0]?.message).toContain(
      'wasm_bindgen',
    );
    expect(validateSource(GOOD + '#[unsafe(no_mangle)] pub fn x(){}', 65536)).toHaveLength(1);
    expect(validateSource('fn main(){}', 65536)[0]?.message).toContain('project');
    expect(validateSource('x'.repeat(70000), 65536)[0]?.message).toContain('limit');
  });
  it('lets compile-time macros read only what is public', () => {
    const ok = (body: string) => validateSource(GOOD + body, 65536);
    expect(ok('const D: &str = env!("CARGO_MANIFEST_DIR");')).toEqual([]);
    expect(ok('const V: &str = env!("CARGO_PKG_VERSION");')).toEqual([]);
    expect(ok('const S: &str = include_str!("scene.rs");')).toEqual([]);
    expect(ok('const S: &str = include_str!("one_shot/tts.rs");')).toEqual([]);
    expect(ok('const K: &str = env!("HOME");')[0]?.message).toContain("Cargo's own variables");
    expect(ok('const K: Option<&str> = option_env!("AWS_SECRET");')).toHaveLength(1);
    expect(ok('const P: &str = include_str!("/etc/passwd");')[0]?.message).toContain(
      'relative path',
    );
    expect(ok('const P: &[u8] = include_bytes!("../../.cargo/credentials");')).toHaveLength(1);
    expect(ok('const P: &str = include_str!(concat!("/etc", "/passwd"));')).toHaveLength(1);
    expect(ok('const P: &str = include_str!(r"/etc/passwd");')).toHaveLength(1);
    expect(ok('macro_rules! e { () => { env!("HOME") } }')).toHaveLength(1);
    // Commented out or inside a string, it does nothing.
    expect(ok('// env!("HOME")\nconst T: &str = "include_str!(\\"/etc/x\\")";')).toEqual([]);
  });
  it('accepts every example the site sends', () => {
    const dir = join(import.meta.dir, '../../../apps/site/src/lib/examples');
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.rs'))) {
      expect([f, validateSource(readFileSync(join(dir, f), 'utf8'), 65536)]).toEqual([f, []]);
    }
  });
  it('ignores comments and strings', () => {
    expect(
      validateSource(GOOD + '// #![no_std]\n/* asm!( */\nconst S: &str = "asm!(";\n', 65536),
    ).toEqual([]);
    expect(stripComments('a/*b*/c')).toBe('a     c');
    const svg =
      'const L: &[u8] = br##"<svg xmlns="http://www.w3.org/2000/svg">\n</svg>"##;\n' + GOOD;
    expect(validateSource(svg, 65536)).toEqual([]);
  });
});

describe('cache key and rate limit', () => {
  it('is stable and depends on sdk version', () => {
    expect(jobId('a', '0.1.0')).toBe(jobId('a', '0.1.0'));
    expect(jobId('a', '0.1.0')).not.toBe(jobId('a', '0.2.0'));
    expect(jobId('a', '0.1.0')).toMatch(/^[0-9a-f]{32}$/);
  });
  it('limits per window', () => {
    const r = new RateLimiter(2, 1000);
    expect([
      r.take('a', 0),
      r.take('a', 1),
      r.take('a', 2),
      r.take('b', 2),
      r.take('a', 1001),
    ]).toEqual([true, true, false, true, true]);
  });
});

describe('cargo output', () => {
  it('extracts errors in scene.rs', () => {
    const out = [
      JSON.stringify({
        reason: 'compiler-message',
        message: {
          level: 'error',
          message: 'cannot find value `x`',
          rendered: 'error[E0425]',
          spans: [{ file_name: 'src/scene.rs', line_start: 7, column_start: 3, is_primary: true }],
        },
      }),
      JSON.stringify({ reason: 'build-finished', success: false }),
    ].join('\n');
    const r = parseCargo(out);
    expect(r.success).toBe(false);
    expect(r.errors).toEqual([
      { file: 'scene.rs', line: 7, column: 3, message: 'cannot find value `x`' },
    ]);
  });
});

describe('API', () => {
  it('compiles, caches and serves artifacts immutably', async () => {
    const runner = new FakeRunner();
    const { app } = createApp(cfg(), runner);
    const r1 = await (await post(app, { source: GOOD, sdk_version: SDK_VERSION })).json();
    expect(r1.status).toBe('done');
    expect(r1.wasm_url).toBe(`http://cdn.test/api/artifact/${r1.id}/bundle.wasm`);
    const r2 = await (await post(app, { source: GOOD, sdk_version: SDK_VERSION })).json();
    expect(r2.id).toBe(r1.id);
    expect(runner.builds).toBe(1);
    const art = await app.fetch(new Request(`http://x/api/artifact/${r1.id}/bundle.wasm`));
    expect(art.headers.get('content-type')).toBe('application/wasm');
    expect(art.headers.get('cache-control')).toContain('immutable');
    const br = await app.fetch(
      new Request(`http://x/api/artifact/${r1.id}/bundle.js`, {
        headers: { 'accept-encoding': 'br' },
      }),
    );
    expect(br.headers.get('content-type')).toContain('javascript');
    const byId = await (await app.fetch(new Request(`http://x/api/compile/${r1.id}`))).json();
    expect(byId.status).toBe('done');
  });

  it('returns structured compiler errors and caches them', async () => {
    const runner = new FakeRunner();
    const { app } = createApp(cfg(), runner);
    const src = GOOD + 'fn f(){ fail!() }';
    const r = await (await post(app, { source: src })).json();
    expect(r.status).toBe('error');
    expect(r.errors[0]).toMatchObject({ line: 2, column: 5 });
    await post(app, { source: src });
    expect(runner.builds).toBe(1);
  });

  it('rejects invalid sources without building', async () => {
    const runner = new FakeRunner();
    const { app } = createApp(cfg(), runner);
    const r = await (await post(app, { source: '#![no_std]\n' + GOOD })).json();
    expect(r.status).toBe('error');
    expect(runner.builds).toBe(0);
    expect((await post(app, { nope: 1 })).status).toBe(400);
    expect((await post(app, { source: GOOD, sdk_version: '9.9.9' })).status).toBe(422);
  });

  it('rate-limits builds per IP but not cache hits', async () => {
    const { app } = createApp(cfg({ ratePerMinute: 2 }), new FakeRunner());
    expect((await post(app, { source: GOOD + '//1' })).status).toBe(200);
    expect((await post(app, { source: GOOD + '//2' })).status).toBe(200);
    const limited = await post(app, { source: GOOD + '//3' });
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBeTruthy();
    expect((await post(app, { source: GOOD + '//1' })).status).toBe(200);
    expect((await post(app, { source: GOOD + '//4' }, '2.2.2.2')).status).toBe(200);
  });

  it('does not rate-limit building the site examples', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ex-'));
    writeFileSync(join(dir, 'hello.rs'), GOOD + '//example');
    const { app } = createApp(cfg({ ratePerMinute: 1 }), new FakeRunner(), { examplesDir: dir });
    expect((await post(app, { source: GOOD + '//1' })).status).toBe(200);
    expect((await post(app, { source: GOOD + '//2' })).status).toBe(429);
    expect((await post(app, { source: GOOD + '//example' })).status).toBe(200);
  });

  it('answers 429 when the queue is full', async () => {
    const runner = new FakeRunner();
    runner.delayMs = 300;
    const { app } = createApp(cfg({ queueLimit: 1, ratePerMinute: 100 }), runner);
    const a = post(app, { source: GOOD + '//a' });
    const b = post(app, { source: GOOD + '//b' });
    await Bun.sleep(20);
    const c = await post(app, { source: GOOD + '//c' });
    expect(c.status).toBe(429);
    await Promise.all([a, b]);
  });

  it('exposes health, metrics and examples', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ex-'));
    writeFileSync(join(dir, 'hello.rs'), '//! Hello world\n' + GOOD);
    const { app, prebuildExamples } = createApp(cfg(), new FakeRunner(), { examplesDir: dir });
    expect(await (await app.fetch(new Request('http://x/healthz'))).text()).toBe('ok');
    let ex = await (await app.fetch(new Request('http://x/api/examples'))).json();
    expect(ex[0]).toMatchObject({ name: 'hello', title: 'Hello world', status: 'missing' });
    await prebuildExamples();
    ex = await (await app.fetch(new Request('http://x/api/examples'))).json();
    expect(ex[0].status).toBe('done');
    const m = await (await app.fetch(new Request('http://x/metrics'))).text();
    expect(m).toContain('oxframe_build_seconds_count 1');
  });

  it('rebuilds examples whose build was interrupted by a restart', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ex-'));
    writeFileSync(join(dir, 'hello.rs'), '//! Hello world\n' + GOOD);
    const c = cfg();
    const before = createApp(c, new FakeRunner(), { examplesDir: dir });
    const id = jobId('//! Hello world\n' + GOOD, '0.1.0', c.buildId);
    // What a killed process leaves on disk.
    before.store.put({ id, status: 'building', errors: [], sdkVersion: '0.1.0', created: 0 });

    const runner = new FakeRunner();
    const { app, prebuildExamples } = createApp(c, runner, { examplesDir: dir });
    let ex = await (await app.fetch(new Request('http://x/api/examples'))).json();
    expect(ex[0].status).toBe('missing');
    await prebuildExamples();
    expect(runner.builds).toBe(1);
    ex = await (await app.fetch(new Request('http://x/api/examples'))).json();
    expect(ex[0].status).toBe('done');
  });
});

describe('transient failures', () => {
  it('are not cached', async () => {
    let calls = 0;
    const runner: Runner = {
      async build() {
        calls++;
        return {
          ok: false,
          transient: true,
          errors: [{ file: 'scene.rs', line: 1, column: 1, message: 'internal' }],
          log: '',
        };
      },
    };
    const { app } = createApp(cfg(), runner);
    await post(app, { source: GOOD });
    await post(app, { source: GOOD });
    expect(calls).toBe(2);
  });
});
