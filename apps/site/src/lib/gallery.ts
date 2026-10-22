/** Gallery cards. Prompts are the brief for the example, not an agent run. */
export interface GalleryItem {
  name: string;
  /** The card's headline: short, unlike the example's first doc line. */
  title: string;
  tags: string[];
  prompt: string;
  /** False for a video made as one, with a voice and assets the browser
   * sandbox does not have: the page shows the code and links to GitHub. */
  playground?: false;
}

export const galleryItems: GalleryItem[] = [
  {
    name: 'one_shot',
    title: 'One scene, one camera, no cuts',
    tags: ['explainer', 'code'],
    prompt:
      'The oxframe promo in one take: the camera pulls back from a semicolon through code, a diagram, a dashboard and a sea. The edit at 5 s shapes the sea at 28 s.',
    playground: false,
  },
  {
    name: 'release',
    title: 'Release notes as a video',
    tags: ['release'],
    prompt:
      'Turn release notes into a video: the version, each section in its color with the changes written on word by word and a halo over each, then an end card.',
  },
  {
    name: 'cube_3d',
    title: 'A lit 3D cube in a 2D diagram',
    tags: ['explainer'],
    prompt:
      'Put a lit 3D cube that turns once inside a 2D diagram, with labels that follow its top and front faces while the camera moves in.',
  },
  {
    name: 'slides',
    title: 'A talk with slides and speaker notes',
    tags: ['explainer'],
    prompt:
      'A short talk: a title, three points that appear one per click, and a closing card, with speaker notes for oxframe present.',
  },
  {
    name: 'matrix_multiply',
    title: 'Matrix multiplication, step by step',
    tags: ['explainer'],
    prompt:
      'Multiply two 2 × 2 matrices step by step: frame a row of A and a column of B, show the dot product, and fill in that cell of the result.',
  },
  {
    name: 'linear_map',
    title: 'A linear map that bends the plane',
    tags: ['explainer'],
    prompt:
      'Show basis vectors i and j and a vector v on axes, shear the plane and then rotate it, with the matrix of the map shown beside the grid.',
  },
  {
    name: 'table_sort',
    title: 'A table that inserts and sorts rows',
    tags: ['explainer'],
    prompt:
      'A table of renderers and frame times: insert a row, sort by frame time, highlight the fastest and remove the slowest.',
  },
  {
    name: 'architecture',
    title: 'An architecture diagram with icons',
    tags: ['explainer'],
    prompt:
      'Draw how a request is served as a flow diagram with Lucide icons, flash the database red for a slow query, then show three brand logos.',
  },
  {
    name: 'gauge',
    title: 'A node of your own: an animated gauge',
    tags: ['explainer'],
    prompt:
      'Write a gauge node of your own with #[derive(Node)] and Draw, then fill three of them in a row to different values.',
  },
  {
    name: 'charts',
    title: 'Function plots on animated axes',
    tags: ['explainer'],
    prompt:
      'Plot sin(x) with a dot riding it, morph it into sin(2x) and zoom out; then a benchmark whose bars grow with their values.',
  },
  {
    name: 'ocean',
    title: 'A shader sea, a splash and a dive',
    tags: ['explainer'],
    prompt:
      'Into the wave: the sea under a camera, a swell, spray toward the lens and a wet lens, a dive into the water, then the sea washes into an end card.',
  },
  {
    name: 'splash',
    title: 'A drop, a wet lens and rising water',
    tags: ['explainer'],
    prompt:
      'A drop rings the water, a splash wets the lens, then the water rises into an end card. Use the lens_drops, ripple and water_wipe presets.',
  },
  {
    name: 'waves',
    title: 'A growing wave, rendered on the CPU',
    tags: ['explainer'],
    prompt:
      'A wave along the bottom grows taller. The title stays at the top. Use the waves preset, not a hand-written shader.',
  },
  {
    name: 'voice',
    title: 'A spoken line in sync with motion',
    tags: ['explainer'],
    prompt:
      'Speak "one two three". When the word two starts, grow a circle, then wait until the line ends.',
  },
  {
    name: 'sounds',
    title: 'A beat in sync with the picture',
    tags: ['explainer'],
    prompt:
      'A dot pulses on a click. A quiet tone plays under it and ducks when the second click is marked priority.',
  },
  {
    name: 'spray',
    title: 'Seeded rain and spray',
    tags: ['explainer'],
    prompt:
      'Rain drawn by a custom node, then a seeded spray toward the camera. Seeking anywhere shows the same dots.',
  },
  {
    name: 'transitions',
    title: 'A slide from a title to an end card',
    tags: ['explainer'],
    prompt: 'Open on a title card, then slide left into an end card.',
  },
  {
    name: 'svg',
    title: 'An SVG logo drawn on, path by path',
    tags: ['logo'],
    prompt: 'Bring in an SVG logo. Draw each path on in turn, then recolor the part with id "dot".',
  },
  {
    name: 'code_steps',
    title: 'A function written in steps',
    tags: ['code', 'explainer'],
    prompt:
      'Write a function in steps. Unchanged tokens slide to their new places, new tokens appear, and the focus follows the line being written.',
  },
  {
    name: 'quicksort',
    title: 'Quicksort, step by step',
    tags: ['code', 'explainer'],
    prompt:
      'Show quicksort on a row of bars. Highlight the code line that is running, and let the bars compare, swap and settle.',
  },
  {
    name: 'camera',
    title: 'A camera tour of a system diagram',
    tags: ['explainer'],
    prompt:
      'Tour a system diagram: show the whole path, zoom onto one step, follow a request, then pull back. Keep the title fixed on screen.',
  },
  {
    name: 'components',
    title: 'An explainer built from components',
    tags: ['explainer', 'release'],
    prompt:
      'Explain binary search with a title card, a chapter marker, a bullet list, a code card, a flow diagram and an end card.',
  },
  {
    name: 'chart',
    title: 'A function plot, drawn on',
    tags: ['chart'],
    prompt: 'Plot a function: axes, a curve that draws itself on, and a dot that rides the curve.',
  },
  {
    name: 'relative',
    title: 'Layout with no pixel coordinates',
    tags: ['vertical'],
    prompt:
      'Lay out a title, a card and a caption with no pixel coordinates, and show the same scene in 16:9, 9:16 and 1:1.',
  },
  {
    name: 'theme',
    title: 'Colors and sizes from the theme',
    tags: ['explainer'],
    prompt: 'A card, a title and a caption that take every color and size from the theme.',
  },
  {
    name: 'text',
    title: 'Typewriter, weight and glyph reveal',
    tags: ['code'],
    prompt: 'Type a sentence on, then change its weight and reveal it glyph by glyph.',
  },
  {
    name: 'typography',
    title: 'Word morphs, rich text and code focus',
    tags: ['code'],
    prompt:
      'Morph one word into another, mix styles in one line, and move a focus through highlighted code.',
  },
  {
    name: 'effects',
    title: 'Gradients, clipping and blend modes',
    tags: ['explainer'],
    prompt: 'Animate a gradient, a dash, a clip, a blur and a shadow.',
  },
  {
    name: 'layout',
    title: 'Rows and columns that size themselves',
    tags: ['explainer'],
    prompt: 'A row that reflows when one child grows.',
  },
  {
    name: 'particles',
    title: 'Seeded randomness and background tasks',
    tags: ['explainer'],
    prompt: 'Many shapes moving on their own from a seed, so the video is the same every time.',
  },
  {
    name: 'morph',
    title: 'Morphing paths and drawing outlines',
    tags: ['explainer'],
    prompt: 'Morph one outline into another, and draw a shape on from start to end.',
  },
  {
    name: 'shapes',
    title: 'Polygons, stars, arcs and a flex row',
    tags: ['explainer'],
    prompt:
      'Draw polygons, stars, arcs and smooth curves, then a row of boxes that grow and wrap like flexbox.',
  },
  {
    name: 'showcase',
    title: 'Two scenes with markers and tunables',
    tags: ['explainer'],
    prompt:
      'Two scenes in one project, with markers, named eases and tunables that the editor changes without recompiling.',
  },
  {
    name: 'intro',
    title: 'A square that turns into a circle',
    tags: ['explainer'],
    prompt: 'A square slides from left to right and turns into a circle in one second.',
  },
];

export function galleryItem(name: string): GalleryItem | undefined {
  return galleryItems.find((item) => item.name === name);
}

/** URL slug of an example: /gallery/cube-3d for `cube_3d`. */
export const slugOf = (name: string) => name.replace(/_/g, '-');

/** The gallery item at /gallery/<slug>. */
export const itemBySlug = (slug: string): GalleryItem | undefined =>
  galleryItems.find((i) => slugOf(i.name) === slug);
