// Compiles the oxframe side of every migration guide (src/lib/migrate/*.rs)
// against the oxframe version in og/Cargo.toml and runs `check` on it, so
// the code the guides show (and open in the playground) builds and passes.
//
//   bun scripts/check-migrate.ts      (needs cargo)
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const site = join(import.meta.dir, '..');
const ports = join(site, 'src/lib/migrate');
const target = join(site, 'og/target');
const crate = join(target, 'migrate-check');

function run(cmd: string[], cwd: string): string {
  const r = spawnSync(cmd[0]!, cmd.slice(1), {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CARGO_TARGET_DIR: target },
  });
  if (r.status !== 0) {
    console.error(`${cmd.join(' ')} failed:\n${r.stdout}${r.stderr}`);
    process.exit(1);
  }
  return r.stdout + r.stderr;
}

const names = readdirSync(ports)
  .filter((f) => f.endsWith('.rs'))
  .map((f) => f.slice(0, -3));
const oxframe = /^oxframe = .*$/m.exec(readFileSync(join(site, 'og/Cargo.toml'), 'utf8'))![0];

rmSync(crate, { recursive: true, force: true });
mkdirSync(join(crate, 'src/bin'), { recursive: true });
writeFileSync(
  join(crate, 'Cargo.toml'),
  `[package]\nname = "migrate-check"\nversion = "0.0.0"\nedition = "2024"\npublish = false\n\n[dependencies]\n${oxframe}\n\n[workspace]\n`,
);
for (const name of names) {
  // The guides use the playground's shape (`pub fn project()`); a binary adds main.
  writeFileSync(
    join(crate, 'src/bin', `${name.replace(/-/g, '_')}.rs`),
    `${readFileSync(join(ports, `${name}.rs`), 'utf8')}\nfn main() {\n    project().main();\n}\n`,
  );
}
run(['cargo', 'build', '--release', '--quiet'], crate);
for (const name of names) {
  const bin = join(target, 'release', name.replace(/-/g, '_'));
  const out = run([bin, 'check'], crate);
  const summary = /check: .*/.exec(out)?.[0] ?? out.trim();
  console.log(`${name}: ${summary}`);
  if (!/ 0 issue\(s\)/.test(summary)) process.exit(1);
}
