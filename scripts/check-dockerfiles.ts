// Every Dockerfile that runs a frozen `bun install` copies the manifests of
// all workspace packages first; one missing breaks the image (bun sees the
// lockfile change). Run by `bun run lint`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const manifests = ['apps', 'packages', 'services'].flatMap((dir) =>
  readdirSync(join(root, dir))
    .map((name) => `${dir}/${name}/package.json`)
    .filter((path) => existsSync(join(root, path))),
);
const dockerfiles = [
  'infra/site.Dockerfile',
  'infra/compile.Dockerfile',
  'services/compile-cf/Dockerfile',
];

let failed = false;
for (const file of dockerfiles) {
  const text = readFileSync(join(root, file), 'utf8');
  for (const m of manifests) {
    if (!text.includes(`COPY ${m} `)) {
      console.error(`${file}: no "COPY ${m} …" before bun install`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log(
  `check-dockerfiles: ${dockerfiles.length} Dockerfiles copy all ${manifests.length} manifests`,
);
