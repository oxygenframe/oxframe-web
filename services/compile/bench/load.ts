// Load test: N concurrent cache-miss builds (distinct sources), reports
// p50/p95 latency and errors. Spec §8: miss p50 ≤ 5 s, p95 ≤ 15 s with warm
// dependencies; §9: 50 concurrent builds before a release.
//   bun bench/load.ts [url] [concurrency]
const url = process.argv[2] ?? 'http://127.0.0.1:8787';
const n = Number(process.argv[3] ?? 50);
const base = await Bun.file(
  new URL('../../../infra/sandbox/template/src/scene.rs', import.meta.url),
).text();
const run = Date.now();

async function one(i: number) {
  const source = `${base}\n// load ${run}-${i}\n`;
  const t = performance.now();
  const res = await fetch(`${url}/api/compile`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.${i >> 8}.${i & 255}` },
    body: JSON.stringify({ source, sdk_version: '0.2.6' }),
  });
  let body = (await res.json()) as { id?: string; status?: string };
  // Like the playground: poll until the build finishes.
  while (res.status === 200 && (body.status === 'queued' || body.status === 'building')) {
    await Bun.sleep(500);
    body = (await (await fetch(`${url}/api/compile/${body.id}`)).json()) as typeof body;
  }
  return { ms: performance.now() - t, http: res.status, status: body.status ?? '?' };
}

const results = await Promise.all(Array.from({ length: n }, (_, i) => one(i)));
const ok = results
  .filter((r) => r.http === 200 && r.status === 'done')
  .map((r) => r.ms)
  .sort((a, b) => a - b);
const q = (p: number) => ok[Math.min(ok.length - 1, Math.floor(p * ok.length))] ?? NaN;
console.log(
  `builds: ${n}, done: ${ok.length}, rejected: ${results.filter((r) => r.http === 429).length}, failed: ${results.filter((r) => r.http === 200 && r.status !== 'done').length}`,
);
console.log(
  `latency p50 ${(q(0.5) / 1000).toFixed(1)} s, p95 ${(q(0.95) / 1000).toFixed(1)} s, max ${(ok.at(-1)! / 1000).toFixed(1)} s`,
);
