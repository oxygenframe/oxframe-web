// Example sources as highlighted HTML, rendered at build time (the
// `?highlight` loader in vite.config.ts). Only the docs embeds import this.
// Gallery-only examples are left out to keep the docs bundle small; an
// embed of one falls back to plain text.
const files = import.meta.glob(
  [
    './examples/*.rs',
    '!./examples/quicksort.rs',
    '!./examples/showcase.rs',
    '!./examples/particles.rs',
    '!./examples/intro.rs',
  ],
  {
    query: '?highlight',
    import: 'default',
    eager: true,
  },
) as Record<string, string>;

/** Highlighted `<pre>` of example `name`, if it exists. */
export function highlightedExample(name: string): string | undefined {
  return files[`./examples/${name}.rs`];
}
