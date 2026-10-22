// Example sources bundled with the site (synced from oxframe-sdk/examples).
import { galleryItems } from './gallery';

const files = import.meta.glob('./examples/*.rs', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface LocalExample {
  name: string;
  title: string;
  source: string;
}

export const localExamples: LocalExample[] = Object.entries(files)
  .map(([path, source]) => ({
    name: path.replace(/^.*\/(.+)\.rs$/, '$1'),
    title: /^\/\/!\s*(.+)$/m.exec(source)?.[1] ?? path,
    source,
  }))
  .sort((a, b) =>
    a.name === 'intro' ? -1 : b.name === 'intro' ? 1 : a.name.localeCompare(b.name),
  );

/** Gallery examples that only show their code, not open in the playground. */
export const codeOnly = new Set(
  galleryItems.filter((i) => i.playground === false).map((i) => i.name),
);

/** Showcase examples for the playground; the `learn_*` guide lessons are excluded. */
export const showcaseExamples = localExamples.filter(
  (e) => !e.name.startsWith('learn_') && !codeOnly.has(e.name),
);

/** Guide lessons, in order. */
export const lessonExamples = localExamples.filter((e) => e.name.startsWith('learn_'));

export function exampleByName(name: string): LocalExample | undefined {
  return localExamples.find((e) => e.name === name);
}
