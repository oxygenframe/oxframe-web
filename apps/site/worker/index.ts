// oxframe.dev: the static site, plus /media/* from R2 (rendered videos and
// their posters, uploaded by scripts/render-media.ts) and shared playground
// videos (/api/share, /s/<id>, see share.ts). Only those paths reach this
// code (`run_worker_first` in wrangler.jsonc); everything else is a static
// asset.
//
// Preview builds (a branch's preview URL) and local runs use the production
// bucket too, but keep their shared videos under previews/ (`sharesBucket`),
// which has its own 30-day lifecycle rule, so tests never mix with real
// shares.
//
// Media paths carry the SDK version (/media/0.20.0/gallery/intro.mp4), so a
// file never changes once uploaded and is cached for a year. Range requests
// are answered, so a video can seek before it has fully loaded.

import { page, upload, type RateLimit, type ShareBucket } from './share';

interface R2Range {
  offset?: number;
  length?: number;
  suffix?: number;
}
interface R2ObjectBody {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  range?: R2Range;
  httpMetadata?: { contentType?: string };
}
interface R2Bucket {
  get(key: string, options?: { range?: R2Range }): Promise<R2ObjectBody | null>;
  head(key: string): Promise<Omit<R2ObjectBody, 'body'> | null>;
}
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  MEDIA: R2Bucket & ShareBucket;
  SHARE_LIMIT?: RateLimit;
}

const TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  png: 'image/png',
  json: 'application/json',
  vtt: 'text/vtt; charset=utf-8',
};

/** `bytes=a-b`, `bytes=a-` or `bytes=-n` as an R2 range; null if unsupported. */
export function parseRange(header: string | null): R2Range | null {
  const m = header?.match(/^bytes=(\d*)-(\d*)$/);
  if (!m || (m[1] === '' && m[2] === '')) return null;
  if (m[1] === '') return { suffix: Number(m[2]) };
  const offset = Number(m[1]);
  return m[2] === '' ? { offset } : { offset, length: Number(m[2]) - offset + 1 };
}

export async function media(request: Request, bucket: R2Bucket): Promise<Response> {
  const path = new URL(request.url).pathname;
  // Only plain file names under /media/: no `..`, no empty segments.
  if (!/^\/media(\/[\w.-]+)+$/.test(path) || path.includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  return file(request, bucket, path.slice(1));
}

/** One object of the bucket, with ranges; its key never changes content.
 * `maxAge` is shorter for shared videos, which are deleted after 30 days. */
export async function file(
  request: Request,
  bucket: R2Bucket,
  key: string,
  maxAge = 31536000,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const ext = key.split('.').pop() ?? '';
  const headers = new Headers({
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Cache-Control': `public, max-age=${maxAge}, immutable`,
    'Accept-Ranges': 'bytes',
  });
  if (request.method === 'HEAD') {
    const head = await bucket.head(key);
    if (!head) return new Response(null, { status: 404 });
    headers.set('Content-Length', String(head.size));
    headers.set('ETag', head.httpEtag);
    return new Response(null, { headers });
  }
  const range = parseRange(request.headers.get('Range'));
  const object = await bucket.get(key, range ? { range } : undefined);
  if (!object) return new Response('Not found', { status: 404 });
  headers.set('ETag', object.httpEtag);
  if (range && object.range) {
    const size = object.size;
    const r = object.range;
    const start = r.suffix !== undefined ? Math.max(0, size - r.suffix) : (r.offset ?? 0);
    const length = r.suffix !== undefined ? size - start : (r.length ?? size - start);
    const end = Math.min(size, start + length) - 1;
    if (start >= size) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set('Content-Length', String(object.size));
  return new Response(object.body, { headers });
}

const PRODUCTION = new Set(['oxframe.dev', 'www.oxframe.dev']);

/** The bucket as shares see it: under previews/ unless served from oxframe.dev. */
export function sharesBucket<B extends R2Bucket & ShareBucket>(bucket: B, host: string): B {
  if (PRODUCTION.has(host)) return bucket;
  const at = (key: string) => `previews/${key}`;
  return {
    ...bucket,
    get: (key: string, options?: { range?: R2Range }) => bucket.get(at(key), options),
    head: (key: string) => bucket.head(at(key)),
    put: (key: string, value: ArrayBuffer | string, options?: Parameters<B['put']>[2]) =>
      bucket.put(at(key), value, options),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path.startsWith('/media/')) return media(request, env.MEDIA);
    const shares = sharesBucket(env.MEDIA, url.hostname);
    if (path === '/api/share') return upload(request, shares, env.SHARE_LIMIT);
    // A share's files (ids are random, so a file never changes) and its page.
    const shared = /^\/s\/([A-Za-z0-9]{10})\/(video\.mp4|poster\.jpg)$/.exec(path);
    if (shared) return file(request, shares, `shares/${shared[1]}/${shared[2]}`, 86400);
    if (path.startsWith('/s/')) {
      const res = await page(request, shares);
      if (res) return res;
      // The site's 404 page, with a 404 status.
      const missing = await env.ASSETS.fetch(new Request(new URL('/404', request.url)));
      return new Response(missing.body, { status: 404, headers: missing.headers });
    }
    return env.ASSETS.fetch(request);
  },
};
