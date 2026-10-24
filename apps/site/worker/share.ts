// Shared videos. The playground renders the scene to MP4 in the browser and
// posts it here with a poster and the scene's share link; `oxframe publish`
// posts a video rendered by the CLI, with a poster and an optional title;
// `/s/<id>` is a page with og:video, so the link unfolds as a video in
// Discord and Slack (X shows the poster). The files live in R2 under
// shares/<id>/ and expire after 30 days (an R2 lifecycle rule on shares/;
// previews and local runs write under previews/shares/, see index.ts).
//
// Limits: an MP4 (checked by its boxes) of at most 16 MB and 30 s, a JPEG
// poster of at most 1 MB, a share link of at most 64 KB, a title of at most
// 100 characters, and a few uploads a
// minute per address (the SHARE_LIMIT rate limiter).

export const MAX_VIDEO = 16 * 1024 * 1024;
export const MAX_POSTER = 1024 * 1024;
export const MAX_CODE = 64 * 1024;
export const MAX_SECONDS = 30;
export const MAX_TITLE = 100;

export interface ShareBucket {
  put(
    key: string,
    value: ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
}

export interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface ShareMeta {
  /** The playground link's hash: `#code=…` (lz-string, URI-safe); absent
   * for videos from `oxframe publish`. */
  code?: string;
  /** Plain text, from `oxframe publish --title`. */
  title?: string;
  seconds: number;
  width: number;
  height: number;
  created: string;
}

/** A box header at `at`: its size and four-letter type. */
function box(view: DataView, at: number): { size: number; type: string } | null {
  if (at + 8 > view.byteLength) return null;
  let size = view.getUint32(at);
  const type = String.fromCharCode(
    view.getUint8(at + 4),
    view.getUint8(at + 5),
    view.getUint8(at + 6),
    view.getUint8(at + 7),
  );
  if (size === 1 && at + 16 <= view.byteLength) size = Number(view.getBigUint64(at + 8));
  else if (size === 0) size = view.byteLength - at;
  return size >= 8 ? { size, type } : null;
}

/**
 * Duration and size of an MP4, from its `ftyp`, `mvhd` and first video
 * `tkhd`; null if the bytes are not an MP4.
 */
export function mp4Info(
  buf: ArrayBuffer,
): { seconds: number; width: number; height: number } | null {
  const view = new DataView(buf);
  const first = box(view, 0);
  if (!first || first.type !== 'ftyp') return null;
  let seconds = -1;
  let width = 0;
  let height = 0;
  const walk = (from: number, to: number) => {
    let at = from;
    while (at < to) {
      const b = box(view, at);
      if (!b || at + b.size > to) return;
      if (b.type === 'moov' || b.type === 'trak') walk(at + 8, at + b.size);
      else if (b.type === 'mvhd') {
        const v = view.getUint8(at + 8);
        const scale = view.getUint32(at + (v === 1 ? 28 : 20));
        const duration = v === 1 ? Number(view.getBigUint64(at + 32)) : view.getUint32(at + 24);
        if (scale > 0) seconds = duration / scale;
      } else if (b.type === 'tkhd' && width === 0 && b.size >= 92) {
        // Width and height are the box's last 8 bytes, 16.16 fixed point; a
        // sound track has 0 and the next track is read.
        width = view.getUint32(at + b.size - 8) / 65536;
        height = view.getUint32(at + b.size - 4) / 65536;
      }
      at += b.size;
    }
  };
  walk(0, view.byteLength);
  return seconds >= 0 ? { seconds, width, height } : null;
}

const isJpeg = (buf: ArrayBuffer) => {
  const b = new Uint8Array(buf, 0, Math.min(3, buf.byteLength));
  return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
};

/** Ten letters and digits from a secure random source. */
export function newId(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/** POST /api/share: multipart `video`, `poster`, and `code` or `title` (both optional). */
export async function upload(
  request: Request,
  bucket: ShareBucket,
  limiter: RateLimit | undefined,
  now = new Date(),
): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST a video' });
  const address = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (limiter && !(await limiter.limit({ key: address })).success) {
    return json(429, { error: 'Too many shares; try again in a minute.' });
  }
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > MAX_VIDEO + MAX_POSTER + MAX_CODE + 4096) {
    return json(413, { error: 'The video is larger than 16 MB.' });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'Expected a form with video, poster and code.' });
  }
  const video = form.get('video');
  const poster = form.get('poster');
  const code = form.get('code') ?? '';
  const title = form.get('title') ?? '';
  if (
    !(video instanceof Blob) ||
    !(poster instanceof Blob) ||
    typeof code !== 'string' ||
    typeof title !== 'string'
  ) {
    return json(400, { error: 'Expected a form with video, poster and code.' });
  }
  if (video.size > MAX_VIDEO) return json(413, { error: 'The video is larger than 16 MB.' });
  if (poster.size > MAX_POSTER) return json(413, { error: 'The poster is larger than 1 MB.' });
  if (code && (code.length > MAX_CODE || !/^#code=[A-Za-z0-9+\-$]+$/.test(code))) {
    return json(400, { error: 'The code is not a playground share link.' });
  }
  // One line of text: control characters and runs of spaces become one space.
  const name = title.replace(/[\p{Cc}\s]+/gu, ' ').trim();
  if ([...name].length > MAX_TITLE) {
    return json(400, { error: `The title is longer than ${MAX_TITLE} characters.` });
  }
  const mp4 = await video.arrayBuffer();
  const info = mp4Info(mp4);
  if (!info) return json(415, { error: 'The video is not an MP4.' });
  if (info.seconds > MAX_SECONDS + 0.5) {
    return json(413, { error: `Videos up to ${MAX_SECONDS} seconds can be shared.` });
  }
  const jpeg = await poster.arrayBuffer();
  if (!isJpeg(jpeg)) return json(415, { error: 'The poster is not a JPEG.' });
  const id = newId();
  const meta: ShareMeta = {
    ...(code ? { code } : {}),
    ...(name ? { title: name } : {}),
    seconds: Math.round(info.seconds * 100) / 100,
    width: Math.round(info.width) || 1920,
    height: Math.round(info.height) || 1080,
    created: now.toISOString(),
  };
  await bucket.put(`shares/${id}/video.mp4`, mp4, { httpMetadata: { contentType: 'video/mp4' } });
  await bucket.put(`shares/${id}/poster.jpg`, jpeg, {
    httpMetadata: { contentType: 'image/jpeg' },
  });
  await bucket.put(`shares/${id}/meta.json`, JSON.stringify(meta), {
    httpMetadata: { contentType: 'application/json' },
  });
  return json(201, { id, url: `${new URL(request.url).origin}/s/${id}` });
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The page of a share: the video, a way into the playground, link previews. */
export function sharePage(origin: string, id: string, meta: ShareMeta): string {
  const base = `${origin}/s/${id}`;
  const title = escape(meta.title ?? 'A scene made with oxframe');
  const description = meta.code
    ? 'Rendered by oxframe from Rust code in the browser. Open it in the playground to see and change the code.'
    : 'A video rendered by oxframe, procedural animation in Rust.';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${escape(description)}">
<meta name="robots" content="noindex">
<meta property="og:type" content="video.other">
<meta property="og:site_name" content="oxframe">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${base}">
<meta property="og:image" content="${base}/poster.jpg">
<meta property="og:image:width" content="${meta.width}">
<meta property="og:image:height" content="${meta.height}">
<meta property="og:video" content="${base}/video.mp4">
<meta property="og:video:secure_url" content="${base}/video.mp4">
<meta property="og:video:type" content="video/mp4">
<meta property="og:video:width" content="${meta.width}">
<meta property="og:video:height" content="${meta.height}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@oxframe">
<meta name="twitter:image" content="${base}/poster.jpg">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{color-scheme:dark;--bg:#111214;--text:#ececee;--muted:#a9abb3;--accent:#6cb2eb}
@media (prefers-color-scheme:light){:root{color-scheme:light;--bg:#fafafa;--text:#16181d;--muted:#50545e;--accent:#1d5fd1}.btn{color:#fff!important}}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 system-ui,sans-serif}
main{max-width:960px;margin:0 auto;padding:24px 16px 48px}
video{display:block;width:100%;height:auto;border-radius:12px;background:#000}
a{color:var(--accent)} p{color:var(--muted)}
.btn{display:inline-block;margin-right:12px;padding:8px 16px;border-radius:8px;background:var(--accent);color:#0b1520;text-decoration:none;font-weight:600}
</style>
</head>
<body>
<main>
<p><a href="/">oxframe</a></p>
<h1>${title}</h1>
<video src="/s/${id}/video.mp4" poster="/s/${id}/poster.jpg" width="${meta.width}" height="${meta.height}" controls playsinline muted autoplay loop></video>
<p>Rendered by oxframe from Rust code${meta.code ? ', in the browser' : ''}. Shared ${escape(meta.created.slice(0, 10))}; links last 30 days.</p>
<p>${meta.code ? `<a class="btn" href="/playground${escape(meta.code)}">Open in the playground</a>` : ''}<a href="/">What is oxframe?</a></p>
</main>
</body>
</html>
`;
}

/** GET /s/<id>: the page; null when there is no such share. */
export async function page(request: Request, bucket: ShareBucket): Promise<Response | null> {
  const m = /^\/s\/([A-Za-z0-9]{10})$/.exec(new URL(request.url).pathname);
  if (!m) return null;
  const object = await bucket.get(`shares/${m[1]}/meta.json`);
  if (!object) return null;
  const meta = JSON.parse(await object.text()) as ShareMeta;
  return new Response(sharePage(new URL(request.url).origin, m[1]!, meta), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy':
        "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
      'X-Robots-Tag': 'noindex',
    },
  });
}
