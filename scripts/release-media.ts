// Copies the release video of each oxframe-sdk release (release.mp4, made by
// its `release video` workflow with release-video-action) to the R2 bucket
// behind oxframe.dev/media, with a poster, and records them in
// apps/site/src/lib/release-media.json for /changelog. Releases already
// recorded are skipped unless named. Run after an SDK release, once the
// video is attached; name a version whose video was made again.
//
//   bun scripts/release-media.ts [0.20.1 …]
//
// File names carry a hash of the video: /media is cached for a year, so a
// new video of the same release needs a new name.
// Needs gh, ffmpeg and a logged-in wrangler.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MediaItem } from './render-media';

const REPO = 'oxygenframe/oxframe-sdk';
const out = join(import.meta.dir, '../apps/site/.media/releases');
const manifest = join(import.meta.dir, '../apps/site/src/lib/release-media.json');

function run(cmd: string[]): string {
  const r = spawnSync(cmd[0]!, cmd.slice(1), { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0)
    throw new Error(`${cmd.join(' ')} failed:\n${(r.stderr || r.stdout).slice(-2000)}`);
  return r.stdout;
}

const refresh = process.argv.slice(2);
const items: Record<string, MediaItem> = existsSync(manifest)
  ? JSON.parse(readFileSync(manifest, 'utf8'))
  : {};
const releases = JSON.parse(
  run(['gh', 'release', 'list', '-R', REPO, '-L', '100', '--json', 'tagName']),
) as { tagName: string }[];

mkdirSync(out, { recursive: true });
for (const { tagName } of releases) {
  const version = tagName.replace(/^v/, '');
  if (items[version] && !refresh.includes(version)) continue;
  const assets = JSON.parse(
    run(['gh', 'release', 'view', tagName, '-R', REPO, '--json', 'assets']),
  ) as { assets: { name: string }[] };
  if (!assets.assets.some((a) => a.name === 'release.mp4')) continue;

  const dir = join(out, version);
  mkdirSync(dir, { recursive: true });
  run([
    'gh',
    'release',
    'download',
    tagName,
    '-R',
    REPO,
    '-p',
    'release.mp4',
    '-D',
    dir,
    '--clobber',
  ]);
  const mp4 = join(dir, 'release.mp4');
  const jpg = join(dir, 'release.jpg');
  const probe = JSON.parse(
    run([
      'ffprobe',
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height:format=duration',
      '-of',
      'json',
      mp4,
    ]),
  ) as { streams: { width: number; height: number }[]; format: { duration: string } };
  const seconds = Number(probe.format.duration);
  // The poster is a frame from the list of changes, not the title.
  run([
    'ffmpeg',
    '-v',
    'error',
    '-y',
    '-ss',
    (seconds * 0.45).toFixed(2),
    '-i',
    mp4,
    '-frames:v',
    '1',
    '-q:v',
    '4',
    jpg,
  ]);
  const hash = createHash('sha256').update(readFileSync(mp4)).digest('hex').slice(0, 8);
  const base = `/media/releases/${version}`;
  for (const [file, type, ext] of [
    [mp4, 'video/mp4', 'mp4'],
    [jpg, 'image/jpeg', 'jpg'],
  ] as const) {
    const key = `oxframe/media/releases/${version}/release-${hash}.${ext}`;
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
  items[version] = {
    mp4: `${base}/release-${hash}.mp4`,
    poster: `${base}/release-${hash}.jpg`,
    seconds: Math.round(seconds * 100) / 100,
    width: probe.streams[0]!.width,
    height: probe.streams[0]!.height,
    bytes: statSync(mp4).size,
  };
  console.log(`${version}: ${seconds.toFixed(1)} s, ${(statSync(mp4).size / 1e6).toFixed(2)} MB`);
}

const sorted = Object.fromEntries(
  Object.entries(items).sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true })),
);
writeFileSync(manifest, JSON.stringify(sorted, null, 2) + '\n');
console.log(`${Object.keys(sorted).length} release videos → ${manifest}`);
