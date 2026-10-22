// The code of the migration guides (/docs/migrate/*): the other tool's
// version (`x.tsx.txt`, `x.py.txt`) and the oxframe port (`x.rs`), which
// scripts/check-migrate.ts compiles and checks. Highlighted at build time.
import { encodeShare } from '$lib/share';

const html = import.meta.glob(['./*.rs', './*.txt'], {
  query: '?highlight',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const sources = import.meta.glob('./*.rs', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Highlighted `<pre>` of a file in this folder (`remotion.tsx.txt`). */
export function code(file: string): string {
  const h = html[`./${file}`];
  if (!h) throw new Error(`no migration code ${file}`);
  return h;
}

/** The playground with the oxframe port of guide `name` loaded. */
export function playground(name: string): string {
  const source = sources[`./${name}.rs`];
  if (!source) throw new Error(`no oxframe port ${name}.rs`);
  return `/playground${encodeShare(source)}`;
}
