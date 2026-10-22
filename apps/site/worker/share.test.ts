import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mp4Info, page, upload, type ShareBucket } from './share';

// A 1.5 s, 64 × 36 H.264 file (ffmpeg testsrc).
const tiny = readFileSync(join(import.meta.dir, 'fixtures/tiny.mp4'));
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const code = '#code=K4ZwpgBA9gHgZgJwIYFswC50AcFgDbAAmG6AVANwBQ';

function memory(): ShareBucket & { files: Map<string, string | ArrayBuffer> } {
  const files = new Map<string, string | ArrayBuffer>();
  return {
    files,
    async put(key, value) {
      files.set(key, value);
    },
    async get(key) {
      const v = files.get(key);
      return typeof v === 'string' ? { text: async () => v } : null;
    },
  };
}

function form(parts: { video?: Uint8Array; poster?: Uint8Array; code?: string }): Request {
  const body = new FormData();
  if (parts.video) body.set('video', new Blob([parts.video], { type: 'video/mp4' }), 'v.mp4');
  if (parts.poster) body.set('poster', new Blob([parts.poster], { type: 'image/jpeg' }), 'p.jpg');
  if (parts.code !== undefined) body.set('code', parts.code);
  return new Request('https://oxframe.dev/api/share', { method: 'POST', body });
}

test('an MP4 is read from its boxes, anything else is not an MP4', () => {
  const buf = tiny.buffer.slice(tiny.byteOffset, tiny.byteOffset + tiny.byteLength);
  expect(mp4Info(buf)).toEqual({ seconds: 1.5, width: 64, height: 36 });
  expect(mp4Info(new TextEncoder().encode('<html>not a video</html>').buffer)).toBeNull();
});

test('a share is stored and has a page with og:video', async () => {
  const bucket = memory();
  const res = await upload(form({ video: tiny, poster: jpeg, code }), bucket, undefined);
  expect(res.status).toBe(201);
  const { id, url } = (await res.json()) as { id: string; url: string };
  expect(url).toBe(`https://oxframe.dev/s/${id}`);
  expect([...bucket.files.keys()].sort()).toEqual([
    `shares/${id}/meta.json`,
    `shares/${id}/poster.jpg`,
    `shares/${id}/video.mp4`,
  ]);
  const html = await (await page(new Request(url), bucket))!.text();
  expect(html).toContain(
    `<meta property="og:video" content="https://oxframe.dev/s/${id}/video.mp4">`,
  );
  expect(html).toContain('<meta name="robots" content="noindex">');
  expect(html).toContain(`href="/playground${code}"`);
  expect(await page(new Request('https://oxframe.dev/s/AAAAAAAAAA'), bucket)).toBeNull();
});

test('what is not a playground video is refused', async () => {
  const bucket = memory();
  const html = new TextEncoder().encode('<script>alert(1)</script>');
  expect((await upload(form({ video: html, poster: jpeg, code }), bucket, undefined)).status).toBe(
    415,
  );
  expect((await upload(form({ video: tiny, poster: html, code }), bucket, undefined)).status).toBe(
    415,
  );
  const bad = '#code="><script>';
  expect(
    (await upload(form({ video: tiny, poster: jpeg, code: bad }), bucket, undefined)).status,
  ).toBe(400);
  expect((await upload(form({ video: tiny, code }), bucket, undefined)).status).toBe(400);
  expect(bucket.files.size).toBe(0);
});

test('too many shares from one address are refused', async () => {
  const limiter = { limit: async () => ({ success: false }) };
  const res = await upload(form({ video: tiny, poster: jpeg, code }), memory(), limiter);
  expect(res.status).toBe(429);
});
