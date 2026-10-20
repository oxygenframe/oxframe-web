// Smoke test of a built image, run inside it with no network
// (deploy-compile.yml, before the image is pushed):
//   bun smoke.ts <scene.rs>
// The scene must build from the warmed SDK alone (no network, no full
// rebuild) and produce a wasm module.
export {};

const base = 'http://127.0.0.1:8080';
const source = await Bun.file(process.argv[2]!).text();

for (let i = 0; ; i++) {
  if (
    await fetch(`${base}/healthz`).then(
      (r) => r.ok,
      () => false,
    )
  )
    break;
  if (i > 60) throw new Error('the service did not start in 60 s');
  await Bun.sleep(1000);
}

const t0 = performance.now();
let r = (await (
  await fetch(`${base}/api/compile`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source, sdk_version: process.env.OXFRAME_SDK_VERSION }),
  })
).json()) as { id: string; status: string; wasm_url?: string; errors?: unknown; log?: string };
while (r.status === 'queued' || r.status === 'building') {
  await Bun.sleep(1000);
  r = (await (await fetch(`${base}/api/compile/${r.id}`)).json()) as typeof r;
}
const seconds = (performance.now() - t0) / 1000;
if (r.status !== 'done') {
  console.error(JSON.stringify(r, null, 2).slice(0, 4000));
  throw new Error(`build failed: ${r.status}`);
}
const wasm = await fetch(r.wasm_url!.replace(/^https?:\/\/[^/]+/, base));
const bytes = (await wasm.arrayBuffer()).byteLength;
if (!wasm.ok || bytes < 100_000) throw new Error(`bad wasm: ${wasm.status}, ${bytes} bytes`);
console.log(`first build ${seconds.toFixed(1)} s, wasm ${(bytes / 1e6).toFixed(2)} MB`);
// A warm image builds a scene in seconds; minutes mean the SDK was rebuilt.
if (seconds > 90) throw new Error(`the warmed SDK was not reused (${seconds.toFixed(0)} s)`);
