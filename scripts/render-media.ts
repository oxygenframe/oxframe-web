// Renders every gallery example to an MP4 and a poster, uploads them to the
// R2 bucket behind oxframe.dev/media (apps/site/worker), and writes
// apps/site/src/lib/media.json, which the gallery and the home page read.
//
//   bun scripts/render-media.ts            # render, upload, write media.json
//   bun scripts/render-media.ts --no-upload intro charts
//
// Files go under media/<sdk version>/gallery/, so they never change once
// uploaded. Run after each SDK release (sdk.ts), with the oxframe-sdk
// checkout of that version next to this repository. Needs ffmpeg and a
// logged-in wrangler.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { galleryItems } from '../apps/site/src/lib/gallery';
import { SDK_VERSION } from '../apps/site/src/lib/sdk';

const sdk = process.env.OXFRAME_SDK_PATH ?? join(import.meta.dir, '../../oxframe-sdk');
const out = join(import.meta.dir, '../apps/site/.media');
const manifest = join(import.meta.dir, '../apps/site/src/lib/media.json');
const args = process.argv.slice(2);
const upload = !args.includes('--no-upload');
const only = args.filter((a) => !a.startsWith('--'));
const SIZE = [1280, 720] as const;

function run(cmd: string[], cwd?: string): string {
  const r = spawnSync(cmd[0]!, cmd.slice(1), { cwd, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) {
    throw new Error(`${cmd.join(' ')} failed:\n${(r.stderr || r.stdout).slice(-2000)}`);
  }
  return r.stdout;
}

export interface MediaItem {
  mp4: string;
  poster: string;
  seconds: number;
  width: number;
  height: number;
  bytes: number;
  /** Captions (spoken lines) for a video with sound; absent for a silent one. */
  captions?: string;
}

mkdirSync(out, { recursive: true });
console.log(`building the examples in ${sdk}…`);
run(['cargo', 'build', '--release', '-p', 'oxframe-examples'], sdk);
const target = JSON.parse(run(['cargo', 'metadata', '--format-version', '1', '--no-deps'], sdk))
  .target_directory as string;

const base = `/media/${SDK_VERSION}/gallery`;
const items: Record<string, MediaItem> = {};
// The gallery, plus the reel on the home page.
const names = [...galleryItems.map((i) => i.name), 'showreel'];
for (const item of names.map((name) => ({ name }))) {
  if (only.length && !only.includes(item.name)) continue;
  const mp4 = join(out, `${item.name}.mp4`);
  const jpg = join(out, `${item.name}.jpg`);
  const vtt = join(out, `${item.name}.vtt`);
  const bin = join(target, 'release', item.name);
  const t0 = Date.now();
  // The examples read assets relative to the SDK's examples directory.
  run(
    [bin, 'render', '--cpu', '--size', `${SIZE[0]}x${SIZE[1]}`, '--out', mp4, '--subtitles', vtt],
    join(sdk, 'examples'),
  );
  const seconds = Number(
    run([
      'ffprobe',
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      mp4,
    ]).trim(),
  );
  // The poster is a frame from the second half, where the scene is built up.
  run([
    'ffmpeg',
    '-v',
    'error',
    '-y',
    '-ss',
    (seconds * 0.6).toFixed(2),
    '-i',
    mp4,
    '-frames:v',
    '1',
    '-q:v',
    '4',
    jpg,
  ]);
  const streams = ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_type'];
  const audio = run(['ffprobe', ...streams, '-of', 'csv=p=0', mp4]).trim() !== '';
  items[item.name] = {
    mp4: `${base}/${item.name}.mp4`,
    poster: `${base}/${item.name}.jpg`,
    seconds: Math.round(seconds * 100) / 100,
    width: SIZE[0],
    height: SIZE[1],
    bytes: statSync(mp4).size,
    ...(audio ? { captions: `${base}/${item.name}.vtt` } : {}),
  };
  console.log(
    `${item.name}: ${seconds.toFixed(1)} s, ${(statSync(mp4).size / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(1)} s`,
  );
  if (upload) {
    const files: [string, string][] = [
      [mp4, 'video/mp4'],
      [jpg, 'image/jpeg'],
    ];
    if (audio) files.push([vtt, 'text/vtt']);
    for (const [file, type] of files) {
      const key = `oxframe/media/${SDK_VERSION}/gallery/${file.split('/').pop()}`;
      run([
        'npx',
        'wrangler',
        'r2',
        'object',
        'put',
        key,
        '--file',
        file,
        '--content-type',
        type,
        '--remote',
      ]);
    }
  }
}

// Rendering some examples updates their entries and keeps the rest.
const previous =
  only.length && existsSync(manifest)
    ? (JSON.parse(readFileSync(manifest, 'utf8')) as { items: Record<string, MediaItem> }).items
    : {};
const all = { ...previous, ...items };
const date = new Date().toISOString().slice(0, 10);
writeFileSync(manifest, JSON.stringify({ sdk: SDK_VERSION, date, items: all }, null, 2) + '\n');
const total = Object.values(all).reduce((n, i) => n + i.bytes, 0);
console.log(`${Object.keys(all).length} videos, ${(total / 1e6).toFixed(1)} MB → ${manifest}`);
