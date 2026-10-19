// Example sources bundled with the site (synced from oxframe-sdk/examples).
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

/** Showcase examples (gallery); the `learn_*` guide lessons are excluded. */
export const showcaseExamples = localExamples.filter((e) => !e.name.startsWith('learn_'));

/** Guide lessons, in order. */
export const lessonExamples = localExamples.filter((e) => e.name.startsWith('learn_'));

export function exampleByName(name: string): LocalExample | undefined {
  return localExamples.find((e) => e.name === name);
}
