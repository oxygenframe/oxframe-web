// compile.oxframe.dev: the public API of services/compile, served by a Worker.
//
// Finished builds (artifacts and compile errors) live in R2, so repeated
// requests — examples, lessons, shared links — never wake a container. A
// miss is forwarded to one of a few build containers, each running
// services/compile (local runner) in its own Firecracker VM without network;
// its result is copied into R2 before answering.
//
// Everything Cloudflare-specific is injected (see index.ts), so this file is
// tested with fakes in test/service.test.ts.

import { validateSource, type ValidationError } from '../../compile/src/validate';

export type Status = 'queued' | 'building' | 'done' | 'error';

/** Same shape as services/compile's JobRecord / CompileResponse. */
export interface JobRecord {
  id: string;
  status: Status;
  errors: ValidationError[];
  log?: string;
  transient?: boolean;
}

export interface CompileResponse {
  id: string;
  status: Status;
  wasm_url: string | null;
  js_url: string | null;
  errors: ValidationError[];
  log?: string;
  transient?: true;
}

/** The R2 operations we use. */
export interface Bucket {
  get(key: string): Promise<{ body: ReadableStream; text(): Promise<string> } | null>;
  put(
    key: string,
    value: ArrayBuffer | string,
    opts?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
}

export interface Example {
  name: string;
  title: string;
  source: string;
}

export interface Deps {
  bucket: Bucket;
  /** Sends a request to the build container responsible for `key`. */
  container(key: string, req: Request): Promise<Response>;
  /** Returns false when the caller is over its build rate. */
  allowBuild(ip: string): Promise<boolean>;
  examples: Example[];
  sdkVersion: string;
  /** Identity of the container image; part of every cache key. */
  buildId: string;
  corsOrigins: string[];
}

const MAX_SOURCE_BYTES = 64 * 1024;
const PREFIX = 'compile/v1/';
const key = (id: string, file: string) => `${PREFIX}${id}/${file}`;
const isJobId = (s: string) => /^[0-9a-f]{32}$/.test(s);

/** Must match services/compile/src/store.ts `jobId`. */
export async function jobId(source: string, sdkVersion: string, buildId: string): Promise<string> {
  const data = new TextEncoder().encode(`${source}\0${sdkVersion}\0${buildId}`);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return [...digest]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

export function createService(d: Deps) {
  const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    });

  const respond = (rec: JobRecord, origin: string): CompileResponse => ({
    id: rec.id,
    status: rec.status,
    wasm_url: rec.status === 'done' ? `${origin}/api/artifact/${rec.id}/bundle.wasm` : null,
    js_url: rec.status === 'done' ? `${origin}/api/artifact/${rec.id}/bundle.js` : null,
    errors: rec.errors,
    ...(rec.log ? { log: rec.log } : {}),
  });

  async function cached(id: string): Promise<JobRecord | null> {
    const obj = await d.bucket.get(key(id, 'record.json'));
    if (!obj) return null;
    const rec = JSON.parse(await obj.text()) as JobRecord;
    return rec.transient ? null : rec;
  }

  /** Copies a finished build from the container into R2. */
  async function persist(id: string, res: CompileResponse): Promise<void> {
    if (res.status === 'done') {
      for (const [file, type] of [
        ['bundle.wasm', 'application/wasm'],
        ['bundle.js', 'text/javascript; charset=utf-8'],
      ] as const) {
        // `identity`: the raw wasm, not the container's .br copy.
        const r = await d.container(
          id,
          new Request(`http://container/api/artifact/${id}/${file}`, {
            headers: { 'Accept-Encoding': 'identity' },
          }),
        );
        if (!r.ok) throw new Error(`container lost ${file} of ${id}: ${r.status}`);
        const bytes = await r.arrayBuffer();
        await d.bucket.put(key(id, file), bytes, { httpMetadata: { contentType: type } });
        if (file === 'bundle.wasm') {
          // Served pre-compressed: ~4 MB of wasm is ~1 MB gzipped.
          const gz = new Response(
            new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')),
          );
          await d.bucket.put(key(id, 'bundle.wasm.gz'), await gz.arrayBuffer(), {
            httpMetadata: { contentType: type },
          });
        }
      }
    }
    // Transient failures (timeouts, tooling) are retried, never cached.
    if ((res.status === 'done' || res.status === 'error') && !res.transient) {
      const rec: JobRecord = { id, status: res.status, errors: res.errors, log: res.log };
      // Record last: it is what marks the artifacts as complete.
      await d.bucket.put(key(id, 'record.json'), JSON.stringify(rec), {
        httpMetadata: { contentType: 'application/json' },
      });
    }
  }

  /** Builds (or joins the build of) `source` in its container. */
  async function build(id: string, source: string): Promise<CompileResponse | Response> {
    const r = await d.container(
      id,
      new Request('http://container/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, sdk_version: d.sdkVersion }),
      }),
    );
    if (!r.ok) return r; // 429 queue full, 4xx/5xx: pass through
    const res = (await r.json()) as CompileResponse;
    if (res.id !== id) throw new Error(`container build id ${res.id} ≠ ${id}: BUILD_ID mismatch`);
    await persist(id, res);
    return res;
  }

  async function compile(req: Request, origin: string): Promise<Response> {
    let body: { source?: unknown; sdk_version?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'expected JSON {source, sdk_version}' }, 400);
    }
    if (typeof body.source !== 'string') return json({ error: '`source` must be a string' }, 400);
    const sdk = typeof body.sdk_version === 'string' ? body.sdk_version : d.sdkVersion;
    if (sdk !== d.sdkVersion) {
      return json({ error: `this service builds with SDK ${d.sdkVersion}, not ${sdk}` }, 422);
    }
    const id = await jobId(body.source, sdk, d.buildId);
    const hit = await cached(id);
    if (hit) return json(respond(hit, origin));

    const invalid = validateSource(body.source, MAX_SOURCE_BYTES);
    if (invalid.length) return json(respond({ id, status: 'error', errors: invalid }, origin));
    const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (!(await d.allowBuild(ip))) {
      return json({ error: 'too many builds; try again in a minute' }, 429, {
        'Retry-After': '60',
      });
    }
    const res = await build(id, body.source);
    if (res instanceof Response) return res;
    return json(respond({ ...res, errors: res.errors ?? [] }, origin));
  }

  /** Polling while a long build runs. */
  async function status(id: string, origin: string): Promise<Response> {
    if (!isJobId(id)) return json({ error: 'unknown id' }, 404);
    const hit = await cached(id);
    if (hit) return json(respond(hit, origin));
    const r = await d.container(id, new Request(`http://container/api/compile/${id}`));
    if (!r.ok) return json({ error: 'unknown id' }, 404);
    const res = (await r.json()) as CompileResponse;
    await persist(id, res);
    return json(respond({ ...res, errors: res.errors ?? [] }, origin));
  }

  async function artifact(id: string, file: string, req: Request): Promise<Response> {
    if (!isJobId(id) || (file !== 'bundle.wasm' && file !== 'bundle.js')) {
      return new Response('not found', { status: 404 });
    }
    const headers: Record<string, string> = {
      'Content-Type':
        file === 'bundle.wasm' ? 'application/wasm' : 'text/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': '*',
      Vary: 'Accept-Encoding',
    };
    if (file === 'bundle.wasm' && (req.headers.get('Accept-Encoding') ?? '').includes('gzip')) {
      const gz = await d.bucket.get(key(id, 'bundle.wasm.gz'));
      if (gz) {
        // `encodeBody: manual` (Workers): the body is already gzip.
        return new Response(gz.body, {
          headers: { ...headers, 'Content-Encoding': 'gzip' },
          encodeBody: 'manual',
        } as ResponseInit);
      }
    }
    const obj = await d.bucket.get(key(id, file));
    if (!obj) return new Response('not found', { status: 404 });
    return new Response(obj.body, { headers });
  }

  async function examples(origin: string): Promise<Response> {
    const list = await Promise.all(
      d.examples.map(async (ex) => {
        const id = await jobId(ex.source, d.sdkVersion, d.buildId);
        const rec = await cached(id);
        return {
          ...ex,
          id,
          status: rec?.status ?? 'missing',
          wasm_url: rec?.status === 'done' ? respond(rec, origin).wasm_url : null,
          js_url: rec?.status === 'done' ? respond(rec, origin).js_url : null,
        };
      }),
    );
    return json(list, 200, { 'Cache-Control': 'public, max-age=60' });
  }

  /** Builds examples that are not in R2 yet, one at a time (cron). */
  async function prebuild(): Promise<string[]> {
    const built: string[] = [];
    for (const ex of d.examples) {
      const id = await jobId(ex.source, d.sdkVersion, d.buildId);
      if (await cached(id)) continue;
      const res = await build(id, ex.source);
      if (!(res instanceof Response)) built.push(`${ex.name}: ${res.status}`);
    }
    return built;
  }

  function cors(req: Request, res: Response): Response {
    const origin = req.headers.get('Origin');
    if (!origin || !(d.corsOrigins.includes('*') || d.corsOrigins.includes(origin))) return res;
    const out = new Response(res.body, res);
    out.headers.set('Access-Control-Allow-Origin', origin);
    out.headers.set('Access-Control-Allow-Methods', 'GET, POST');
    out.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    out.headers.append('Vary', 'Origin');
    return out;
  }

  async function fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const p = url.pathname;
    if (req.method === 'OPTIONS') return cors(req, new Response(null, { status: 204 }));
    let res: Response;
    if (p === '/healthz') res = new Response('ok');
    else if (p === '/api/compile' && req.method === 'POST') res = await compile(req, url.origin);
    else if (p.startsWith('/api/compile/') && req.method === 'GET')
      res = await status(p.slice('/api/compile/'.length), url.origin);
    else if (p.startsWith('/api/artifact/') && req.method === 'GET') {
      const [id = '', file = ''] = p.slice('/api/artifact/'.length).split('/');
      res = await artifact(id, file, req);
    } else if (p === '/api/examples' && req.method === 'GET') res = await examples(url.origin);
    else res = new Response('not found', { status: 404 });
    return cors(req, res);
  }

  return { fetch, prebuild };
}
