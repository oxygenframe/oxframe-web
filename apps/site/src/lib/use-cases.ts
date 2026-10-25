// The use cases: one page each at /use-cases/<slug>, built from gallery
// examples. `points` are short HTML (our own text) with links to the docs.

export interface UseCase {
  slug: string;
  /** The h1 and the card title. */
  name: string;
  /** <title>, before " — oxframe" (keep the whole under 65 characters). */
  title: string;
  description: string;
  lead: string;
  /** Gallery examples; the first one's video heads the page. */
  examples: string[];
  /** How a video of this kind is built. */
  points: string[];
  /** The agent skill made for it (/agents/skills/<name>). */
  skill: string;
  /** A first prompt for an agent with that skill. */
  prompt: string;
}

export const useCases: UseCase[] = [
  {
    slug: 'release-videos',
    name: 'Release videos',
    title: 'Release notes to video with a GitHub Action',
    description:
      'Turn every GitHub release into a short video: the notes become title cards and lists, checked by oxframe and attached to the release as an MP4.',
    lead: 'Publish a release and its notes become a video attached to it. Headings become title cards, lists become bullet lists, and text that does not fit is split across cards instead of cut.',
    examples: ['release', 'transitions', 'components'],
    points: [
      'The <a href="https://github.com/oxygenframe/release-video-action">release-video Action</a> reads the notes, writes the scenes and renders them on a plain runner; no model call.',
      '<code>oxframe check</code> runs first: a card that cannot fit its text is split in two and checked again.',
      'Your own scenes use the same <a href="/docs/guide/components">components</a>: <code>TitleCard</code>, <code>BulletList</code>, <code>EndCard</code>.',
      'A <code>[theme]</code> table in the repository’s <code>oxframe.toml</code> gives the video your colors.',
    ],
    skill: 'release-to-video',
    prompt:
      'Make a 20-second video of the latest release in CHANGELOG.md: a title with the version, the changes as a list, an end card. Run oxframe check until it passes.',
  },
  {
    slug: 'code-walkthroughs',
    name: 'Code walkthroughs',
    title: 'Code walkthrough videos from your source',
    description:
      'Explain code in a video: a listing whose focus moves line by line, edits that slide tokens into place, and the data moving in step with the code.',
    lead: 'Show a function being written, a change in a pull request, or an algorithm running with its code beside it. The listing is highlighted, the focus moves with the story, and edits slide instead of retyping.',
    examples: ['code_steps', 'quicksort', 'typography'],
    points: [
      '<code>Code</code> highlights Rust, JavaScript, Python, JSON, TOML and shell; <code>focus_lines</code> dims everything but the lines that matter (<a href="/docs/nodes">all nodes</a>).',
      '<code>.code().to(next, s)</code> diffs the tokens: unchanged ones slide, new ones appear; <code>insert</code>, <code>replace</code> and <code>.flash()</code> show one edit.',
      '<code>CodeExplainer</code> steps through a listing with a caption for each step (<a href="/docs/guide/components">components</a>).',
      'Bars, tables and text bound to <a href="/docs/guide/signals">signals</a> move in step with the code.',
    ],
    skill: 'code-walkthrough',
    prompt:
      'Make a 30-second walkthrough of the parse function in src/parser.rs: show it, then step through it with the focus on the lines that matter and a caption for each step.',
  },
  {
    slug: 'math',
    name: 'Math animations',
    title: 'Math animations in Rust: plots, vectors, matrices',
    description:
      'Animate math the 3Blue1Brown way in Rust: function plots, vectors and linear maps, matrix multiplication step by step, live in the browser.',
    lead: 'Plots that redraw as their ranges move, vectors and a grid that bend under a linear map, and matrices that multiply step by step. It all runs in the browser playground, with nothing to install.',
    examples: ['matrix_multiply', 'linear_map', 'charts'],
    points: [
      '<code>Axes</code> plots any function of x and samples it every frame, so plots follow animated ranges and morph with <code>to_fn</code> (<a href="/docs/charts">charts</a>).',
      '<code>axes.apply_matrix</code> moves the grid, the vectors and every placed node; <code>Matrix</code> frames rows, columns and cells (<a href="/docs/matrices">matrices</a>).',
      'Any path morphs into any other, and outlines draw on (<a href="/docs/guide/drawing">drawing and morphing</a>).',
      'Formulas are set by Typst with a bundled font and animate glyph by glyph (<a href="/docs/formulas">formulas</a>, the <code>math</code> feature; not in the browser playground).',
    ],
    skill: 'math-explainer',
    prompt:
      'Explain the dot product in 30 seconds: two vectors on axes, the projection of one onto the other, and the value updating as the angle changes.',
  },
  {
    slug: 'charts',
    name: 'Charts and data',
    title: 'Animated charts and data videos in Rust',
    description:
      'Make animated bar charts, line charts and tables from your data: values grow, ranges move and rows sort themselves, rendered to MP4 in CI.',
    lead: 'Bars that grow to their values, a line series drawn on, ranges that rescale, and a table whose rows sort themselves. The data is Rust, so it can come from a CSV or an API before the scene starts.',
    examples: ['charts', 'chart', 'table_sort'],
    points: [
      '<code>axes.bars</code>, <code>line_series</code> and <code>scatter</code>: every value is a signal, so it animates with <code>.to()</code> (<a href="/docs/charts">charts</a>).',
      'Ranges are signals too: <code>axes.x_range().to(..)</code> rescales the axes and everything on them.',
      '<code>Table</code> inserts and removes rows and sorts by a column, with the rows sliding into place (<a href="/docs/matrices">tables</a>).',
      'The same project renders on any CI runner with <code>--cpu</code> (<a href="/docs/rendering">rendering</a>).',
    ],
    skill: 'chart-video',
    prompt:
      'Turn data/sales.csv into a 20-second video: a bar chart per region that grows to its value, then the bars sorted from largest to smallest.',
  },
  {
    slug: 'product-demos',
    name: 'Product and architecture explainers',
    title: 'Product and architecture explainer videos',
    description:
      'Explain how your system works: an architecture diagram with icons, a camera that tours it step by step, and 3D models inside the 2D scene.',
    lead: 'A diagram of the system, the camera moving from one part to the next, labels that stay on screen, and a 3D model where a flat icon is not enough.',
    examples: ['architecture', 'camera', 'cube_3d'],
    points: [
      '<code>FlowDiagram</code> lays out boxes and arrows, with icons from Lucide, Tabler and brand logos (<a href="/docs/icons">icons</a>).',
      'The <a href="/docs/camera">camera</a> fits the whole diagram, then zooms onto one step; titles added to the view stay put.',
      '<code>View3d</code> puts lit meshes and glTF models into the 2D scene, with labels that follow them (<a href="/docs/3d">3D</a>).',
      'Every scene renders in 16:9, 9:16 and 1:1 from the same code (<a href="/docs/rendering">rendering</a>).',
    ],
    skill: 'oxframe',
    prompt:
      'Make a 30-second architecture video: browser, API, queue and database as a diagram with icons, then the camera following one request through it.',
  },
  {
    slug: 'presentations',
    name: 'Presentations',
    title: 'Presentations from code: slides that animate',
    description:
      'Give a talk from the same scenes that render to video: oxframe present stops at each slide break, shows speaker notes, and exports a PDF.',
    lead: 'The scenes of a video become a talk: the presentation stops at every slide break and waits for the next click, with speaker notes and a timer in a second window.',
    examples: ['slides', 'components'],
    points: [
      '<code>slide_break().await</code> marks a stop; a render plays straight through it (<a href="/docs/presentations">presentations</a>).',
      '<code>notes("…")</code> are speaker notes; <code>oxframe present</code> opens them with N, next to a timer.',
      '<code>oxframe render --slides talk.pdf</code> writes one page per stop.',
      'Going back is exact: the state of a scene depends only on its frame.',
    ],
    skill: 'slides',
    prompt:
      'Make a five-slide talk about our caching layer: a title, three points with a diagram each, and a closing slide, with speaker notes for every slide.',
  },
  {
    slug: 'voiceover',
    name: 'Voiceover and sound',
    title: 'Videos with voiceover and sound in sync',
    description:
      'Add a voiceover that drives the animation: wait for a spoken word, duck the music under the voice, and export subtitles with the video.',
    lead: 'The voice drives the picture: a scene waits for a word before the next shape appears, the music ducks while someone speaks, and subtitles come out of the same render.',
    examples: ['voice', 'sounds'],
    points: [
      '<code>voice("…").start()</code> speaks a line; <code>.at_word("square")</code> waits for that word (<a href="/docs/guide/sound">sound and voice</a>).',
      'oxframe does not call a speech service: you plug in your own provider with <code>TtsProvider</code>, and the audio is cached so CI renders it without a key.',
      '<code>sound("click.wav").play()</code> puts effects on the timeline; <code>Audio::track(..).duck_under_voice()</code> lowers the music under speech.',
      '<code>oxframe render --subtitles out.vtt</code> writes the captions.',
    ],
    skill: 'voiceover',
    prompt:
      'Add a voiceover to the intro scene: one line per step, each shape appearing when its word is spoken, and subtitles in out/intro.vtt.',
  },
];

export const useCaseBySlug = (slug: string) => useCases.find((u) => u.slug === slug);
