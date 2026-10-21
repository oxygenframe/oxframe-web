// Page list of the oxframe 0.19.0 docs (snapshot, see scripts/archive-docs.ts).
import type { DocSection } from '../docs';

export const sections: DocSection[] = [
  {
    title: 'Start here',
    pages: [
      {
        slug: '',
        title: 'Welcome',
        description:
          'Learn oxframe: make animations and motion graphics by writing Rust code, with a live editor to scrub through them and fine-tune the timing.',
      },
      {
        slug: 'getting-started',
        title: 'Install and first project',
        description:
          'Install the oxframe CLI with cargo, create your first animation project and open the live editor — five minutes from nothing to a moving scene.',
      },
    ],
  },
  {
    title: 'Guide',
    pages: [
      {
        slug: 'guide/hello',
        title: '1. Your first animation',
        description:
          'Lesson 1 of the oxframe guide: add a circle to the screen and animate it with Rust. The basic pattern behind every animation, with a live example.',
      },
      {
        slug: 'guide/together',
        title: '2. In order, or all at once',
        description:
          'Lesson 2: run animations in order, all at once or as a ripple with all and stagger, plus ready-made entrances like fade_in and pop_in.',
      },
      {
        slug: 'guide/shapes',
        title: '3. Shapes, colors, transforms',
        description:
          'Lesson 3: rectangles, circles, lines and polygons; fills and outlines; rotation, scale and color — the properties every oxframe shape shares.',
      },
      {
        slug: 'guide/easing',
        title: '4. Easing',
        description:
          'Lesson 4: easing curves explained — why some animations feel natural and others robotic, and how to pick the right ease-in and ease-out curve.',
      },
      {
        slug: 'guide/text',
        title: '5. Text',
        description:
          'Lesson 5: animate text in Rust — titles, typewriter effects, mixed styles and syntax-highlighted code blocks with oxframe.',
      },
      {
        slug: 'guide/groups',
        title: '6. Groups and layout',
        description:
          'Lesson 6: nest shapes in groups and let flexbox-style layout arrange them, so whole compositions move and scale together.',
      },
      {
        slug: 'guide/editor',
        title: '7. Tweak timing in the editor',
        description:
          'Lesson 7: adjust timing by eye in the oxframe editor — markers, eases and tunables you can drag without touching or recompiling code.',
      },
      {
        slug: 'guide/signals',
        title: '8. Signals',
        description:
          'Lesson 8: signals make one value follow another — a line that always connects two dots, a label that always shows a number.',
      },
      {
        slug: 'guide/drawing',
        title: '9. Drawing and morphing',
        description:
          'Lesson 9: draw an outline as if with a pen, then morph one shape into another — path drawing and shape morphing in oxframe.',
      },
      {
        slug: 'guide/random',
        title: '10. Randomness and background tasks',
        description:
          'Lesson 10: background tasks and seeded randomness — many things moving on their own while the story continues, rendering the same video every time.',
      },
      {
        slug: 'guide/scenes',
        title: '11. Scenes and transitions',
        description:
          'Lesson 11: build a video from several scenes and blend them with slide, fade, wipe and zoom transitions, all in one oxframe render.',
      },
      {
        slug: 'guide/sound',
        title: '12. Sound and voice',
        description:
          'Lesson 12: add sound effects on the beat, a soundtrack that ducks under speech, and time animations to the words of a spoken line.',
      },
      {
        slug: 'guide/shaders',
        title: '13. Shaders and effects',
        description:
          'Lesson 13: animated water, drops on the camera lens, ripples on a node and a water transition — shader presets you animate like any property.',
      },
      {
        slug: 'guide/charts',
        title: '14. Charts and graphs',
        description:
          'Lesson 14: plot functions on axes, ride a dot along a curve, morph it into another function and zoom — the whole chart follows the ranges.',
      },
      {
        slug: 'guide/matrices',
        title: '15. Vectors and matrices',
        description:
          'Lesson 15: draw a vector on axes, stretch the whole plane with a 2 × 2 matrix and show the numbers in brackets — the grid and the arrow follow.',
      },
    ],
  },
  {
    title: 'Going further',
    pages: [
      {
        slug: 'guide/components',
        title: 'Components',
        description:
          'Build an explainer from ready-made blocks: title cards, bullet lists, code, flow diagrams, callouts, lower thirds and end cards.',
      },
      {
        slug: 'nodes',
        title: 'All nodes',
        description:
          'Reference of every oxframe node and its properties: Rect, Circle, Line, Path, Polygon, Star, Txt, Code, Img, Layout and Grid.',
      },
      {
        slug: 'effects',
        title: 'Effects',
        description:
          'Gradients, dashes, shadows, blur, blend modes and clipping in oxframe. Every effect is a signal and animates like any other property.',
      },
      {
        slug: 'charts',
        title: 'Animated charts and plots',
        description:
          'Animated charts in Rust: axes with labels, function plots that follow animated ranges, bars that grow with their values, and number lines.',
      },
      {
        slug: 'matrices',
        title: 'Matrices, vectors and tables',
        description:
          'Animated matrices, vectors and tables in Rust: matrix multiplication step by step, linear maps that bend the grid, and rows that sort themselves.',
      },
      {
        slug: '3d',
        title: '3D scenes in 2D animations',
        description:
          'Add lit 3D models to oxframe animations: cubes, spheres and glTF models, a camera and lights as signals, and 2D labels pinned to 3D points.',
      },
      {
        slug: 'presentations',
        title: 'Presentations from scenes',
        description:
          'Turn oxframe scenes into a talk: slide_break stops, speaker notes in a presenter window, clicker keys, and every stop as a PDF page.',
      },
      {
        slug: 'custom-nodes',
        title: 'Writing your own node',
        description:
          'Make a node of your own in Rust: a struct that draws with DrawCtx, animatable signal fields, layout and checks, and a crate template.',
      },
      {
        slug: 'icons',
        title: 'Icons: Lucide, Tabler and brand logos',
        description:
          'Lucide, Tabler and Simple Icons in Rust animations: icon!("lucide:server") by name, colors and line widths as signals, and icons in flow diagrams.',
      },
      {
        slug: 'camera',
        title: 'Camera',
        description:
          'Zoom, pan and rotate the view in oxframe: fit a whole diagram, center on a detail, follow a moving node, and keep titles on screen.',
      },
      {
        slug: 'timing',
        title: 'Markers, eases, tunables',
        description:
          'Markers, custom eases and tunables: timing values stored outside your Rust code so you can adjust them visually in the oxframe editor.',
      },
      {
        slug: 'editor',
        title: 'The editor',
        description:
          'A tour of the oxframe editor: viewport, timeline, inspector and hot reload — the same app in oxframe dev and in the browser playground.',
      },
      {
        slug: 'rendering',
        title: 'Rendering video',
        description:
          'Render oxframe animations to MP4, WebM with alpha, ProRes 4444 or PNG sequences with one command, on the GPU or CPU, with audio and scene transitions.',
      },
      {
        slug: 'cli',
        title: 'CLI reference',
        description:
          'Reference for the oxframe command line: init, dev, render, snapshot, check, agents, upgrade and mcp, with all options.',
      },
      {
        slug: 'agents',
        title: 'Working with AI agents',
        description:
          'Use Claude Code, Codex or Cursor to write oxframe animations: every project ships agent instructions and a way for agents to see what they made.',
      },
    ],
  },
  {
    title: 'Under the hood',
    pages: [
      {
        slug: 'how-it-works',
        title: 'How oxframe works',
        description:
          'How oxframe works inside: scenes as Rust coroutines, deterministic rendering, instant scrubbing, and compiling Rust to WebAssembly for the browser.',
      },
    ],
  },
];
