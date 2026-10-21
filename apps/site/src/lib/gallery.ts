/** Gallery cards. Prompts are the brief for the example, not an agent run. */
export interface GalleryItem {
  name: string;
  tags: string[];
  prompt: string;
}

export const galleryItems: GalleryItem[] = [
  {
    name: 'release',
    tags: ['release'],
    prompt:
      'Turn release notes into a video: a title with the version, the changes as a list, then an end card that says made with oxframe.',
  },
  {
    name: 'spray',
    tags: ['explainer'],
    prompt:
      'Rain drawn by a custom node, then a seeded spray toward the camera. Seeking anywhere shows the same dots.',
  },
  {
    name: 'transitions',
    tags: ['explainer'],
    prompt: 'Open on a title card, then slide left into an end card.',
  },
  {
    name: 'svg',
    tags: ['logo'],
    prompt: 'Bring in an SVG logo. Draw each path on in turn, then recolor the part with id "dot".',
  },
  {
    name: 'code_steps',
    tags: ['code', 'explainer'],
    prompt:
      'Write a function in steps. Unchanged tokens slide to their new places, new tokens appear, and the focus follows the line being written.',
  },
  {
    name: 'quicksort',
    tags: ['code', 'explainer'],
    prompt:
      'Show quicksort on a row of bars. Highlight the code line that is running, and let the bars compare, swap and settle.',
  },
  {
    name: 'camera',
    tags: ['explainer'],
    prompt:
      'Tour a system diagram: show the whole path, zoom onto one step, follow a request, then pull back. Keep the title fixed on screen.',
  },
  {
    name: 'components',
    tags: ['explainer', 'release'],
    prompt:
      'Explain binary search with a title card, a chapter marker, a bullet list, a code card, a flow diagram and an end card.',
  },
  {
    name: 'chart',
    tags: ['chart'],
    prompt: 'Plot a function: axes, a curve that draws itself on, and a dot that rides the curve.',
  },
  {
    name: 'relative',
    tags: ['vertical'],
    prompt:
      'Lay out a title, a card and a caption with no pixel coordinates, and show the same scene in 16:9, 9:16 and 1:1.',
  },
  {
    name: 'theme',
    tags: ['explainer'],
    prompt: 'A card, a title and a caption that take every color and size from the theme.',
  },
  {
    name: 'text',
    tags: ['code'],
    prompt: 'Type a sentence on, then change its weight and reveal it glyph by glyph.',
  },
  {
    name: 'typography',
    tags: ['code'],
    prompt:
      'Morph one word into another, mix styles in one line, and move a focus through highlighted code.',
  },
  {
    name: 'effects',
    tags: ['explainer'],
    prompt: 'Animate a gradient, a dash, a clip, a blur and a shadow.',
  },
  {
    name: 'layout',
    tags: ['explainer'],
    prompt: 'A row that reflows when one child grows.',
  },
  {
    name: 'particles',
    tags: ['explainer'],
    prompt: 'Many shapes moving on their own from a seed, so the video is the same every time.',
  },
  {
    name: 'morph',
    tags: ['explainer'],
    prompt: 'Morph one outline into another, and draw a shape on from start to end.',
  },
];

export function galleryItem(name: string): GalleryItem | undefined {
  return galleryItems.find((item) => item.name === name);
}
