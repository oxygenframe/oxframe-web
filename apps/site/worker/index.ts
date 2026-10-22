// oxframe.dev: the static site, plus /media/* from R2 (rendered videos and
// their posters, uploaded by scripts/render-media.ts). Only /media/* reaches
// this code (`run_worker_first` in wrangler.jsonc); everything else is a
// static asset.
//
// Media paths carry the SDK version (/media/0.20.0/gallery/intro.mp4), so a
// file never changes once uploaded and is cached for a year. Range requests
// are answered, so a video can seek before it has fully loaded.

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
  MEDIA: R2Bucket;
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
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const path = new URL(request.url).pathname;
  // Only plain file names under /media/: no `..`, no empty segments.
  if (!/^\/media(\/[\w.-]+)+$/.test(path) || path.includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  const key = path.slice(1);
  const ext = key.split('.').pop() ?? '';
  const headers = new Headers({
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname.startsWith('/media/')) return media(request, env.MEDIA);
    return env.ASSETS.fetch(request);
  },
};
