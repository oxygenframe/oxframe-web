import { expect, test } from 'bun:test';
import { media, parseRange, sharesBucket } from './index';

const data = new TextEncoder().encode('0123456789');
const bucket = {
  async get(
    key: string,
    options?: { range?: { offset?: number; length?: number; suffix?: number } },
  ) {
    if (key !== 'media/0.20.0/gallery/intro.mp4') return null;
    const r = options?.range;
    let slice = data;
    if (r?.suffix !== undefined) slice = data.slice(data.length - r.suffix);
    else if (r)
      slice = data.slice(r.offset ?? 0, r.length ? (r.offset ?? 0) + r.length : undefined);
    return {
      body: new Response(slice).body!,
      size: data.length,
      httpEtag: '"e1"',
      range: r,
    };
  },
  async head(key: string) {
    return key === 'media/0.20.0/gallery/intro.mp4'
      ? { size: data.length, httpEtag: '"e1"' }
      : null;
  },
};
const url = 'https://oxframe.dev/media/0.20.0/gallery/intro.mp4';

test('ranges parse', () => {
  expect(parseRange('bytes=2-5')).toEqual({ offset: 2, length: 4 });
  expect(parseRange('bytes=7-')).toEqual({ offset: 7 });
  expect(parseRange('bytes=-3')).toEqual({ suffix: 3 });
  expect(parseRange('bytes=a-b')).toBeNull();
  expect(parseRange(null)).toBeNull();
});

test('a whole file, a range, and a missing file', async () => {
  const full = await media(new Request(url), bucket);
  expect(full.status).toBe(200);
  expect(full.headers.get('Content-Type')).toBe('video/mp4');
  expect(full.headers.get('Cache-Control')).toContain('immutable');
  expect(await full.text()).toBe('0123456789');

  const part = await media(new Request(url, { headers: { Range: 'bytes=2-5' } }), bucket);
  expect(part.status).toBe(206);
  expect(part.headers.get('Content-Range')).toBe('bytes 2-5/10');
  expect(await part.text()).toBe('2345');

  const tail = await media(new Request(url, { headers: { Range: 'bytes=-3' } }), bucket);
  expect(tail.headers.get('Content-Range')).toBe('bytes 7-9/10');
  expect(await tail.text()).toBe('789');

  expect((await media(new Request(url.replace('intro', 'nope')), bucket)).status).toBe(404);
  expect((await media(new Request('https://oxframe.dev/media/../secret'), bucket)).status).toBe(
    404,
  );
  const head = await media(new Request(url, { method: 'HEAD' }), bucket);
  expect(head.headers.get('Content-Length')).toBe('10');
});

test('shares off oxframe.dev go under previews/', async () => {
  const keys: string[] = [];
  const store = {
    ...bucket,
    async get(key: string) {
      keys.push(`get ${key}`);
      return null;
    },
    async head(key: string) {
      keys.push(`head ${key}`);
      return null;
    },
    async put(key: string) {
      keys.push(`put ${key}`);
    },
  };
  expect(sharesBucket(store, 'oxframe.dev')).toBe(store);
  const preview = sharesBucket(store, 'abc123-oxframe-site.example.workers.dev');
  await preview.put('shares/x/meta.json', '{}');
  await preview.get('shares/x/meta.json');
  await preview.head('shares/x/video.mp4');
  expect(keys).toEqual([
    'put previews/shares/x/meta.json',
    'get previews/shares/x/meta.json',
    'head previews/shares/x/video.mp4',
  ]);
});
