// The documentation, in reading order. Each section builds on the previous
// one; the sidebar and the "Next" links follow this list.
export interface DocPage {
  slug: string;
  title: string;
}

export interface DocSection {
  title: string;
  pages: DocPage[];
}

export const sections: DocSection[] = [
  {
    title: 'Start here',
    pages: [
      { slug: '', title: 'Welcome' },
      { slug: 'getting-started', title: 'Install and first project' },
    ],
  },
  {
    title: 'Guide',
    pages: [
      { slug: 'guide/hello', title: '1. Your first animation' },
      { slug: 'guide/together', title: '2. In order, or all at once' },
      { slug: 'guide/shapes', title: '3. Shapes, colors, transforms' },
      { slug: 'guide/easing', title: '4. Easing' },
      { slug: 'guide/text', title: '5. Text' },
      { slug: 'guide/groups', title: '6. Groups and layout' },
      { slug: 'guide/editor', title: '7. Tweak timing in the editor' },
      { slug: 'guide/signals', title: '8. Signals' },
      { slug: 'guide/drawing', title: '9. Drawing and morphing' },
      { slug: 'guide/random', title: '10. Randomness and background tasks' },
    ],
  },
  {
    title: 'Going further',
    pages: [
      { slug: 'nodes', title: 'All nodes' },
      { slug: 'effects', title: 'Effects' },
      { slug: 'timing', title: 'Markers, eases, tunables' },
      { slug: 'editor', title: 'The editor' },
      { slug: 'rendering', title: 'Rendering video' },
      { slug: 'cli', title: 'CLI reference' },
      { slug: 'agents', title: 'Working with AI agents' },
    ],
  },
  {
    title: 'Under the hood',
    pages: [{ slug: 'how-it-works', title: 'How oxframe works' }],
  },
];

export const pages: DocPage[] = sections.flatMap((s) => s.pages);

export function href(slug: string): string {
  return slug ? `/docs/${slug}` : '/docs';
}

/** Previous and next page around the current path. */
export function neighbors(path: string): { prev?: DocPage; next?: DocPage } {
  const i = pages.findIndex((p) => href(p.slug) === path.replace(/\/$/, ''));
  if (i < 0) return {};
  return { prev: pages[i - 1], next: pages[i + 1] };
}
