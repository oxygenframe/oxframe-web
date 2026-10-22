// Removes one shared playground video (oxframe.dev/s/<id>) from R2 before it
// expires on its own after 30 days, e.g. after a complaint.
//
//   bun scripts/delete-share.ts <id>
import { spawnSync } from 'node:child_process';

const id = process.argv[2] ?? '';
if (!/^[A-Za-z0-9]{10}$/.test(id)) {
  console.error('usage: bun scripts/delete-share.ts <10-character id from /s/<id>>');
  process.exit(1);
}
for (const file of ['video.mp4', 'poster.jpg', 'meta.json']) {
  const r = spawnSync(
    'npx',
    ['wrangler', 'r2', 'object', 'delete', `oxframe/shares/${id}/${file}`, '--remote'],
    { stdio: 'inherit' },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(`deleted share ${id}`);
