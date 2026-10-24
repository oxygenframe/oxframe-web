// /alternatives/remotion and /alternatives/motion-canvas: the tools people
// move to, by the oxframe team (the pages say so). Facts come from the
// sources of the /vs/* pages, checked on CHECKED in src/lib/vs.ts (the
// Motion Canvas list on MOTION_CANVAS_CHECKED).

export interface Alternative {
  name: string;
  /** /vs/<slug> when we have a comparison page for it. */
  vs?: string;
  url: string;
  what: string;
  license: string;
  renders: string;
  bestFor: string;
  watchOut: string;
}

export const remotionAlternatives: Alternative[] = [
  {
    name: 'oxframe',
    vs: 'remotion',
    url: 'https://github.com/oxygenframe/oxframe-sdk',
    what: 'Motion graphics in Rust, built for AI agents: scenes with signals and layout, a live editor with a timeline, a browser playground, and oxframe check, which reports what is wrong in the frames.',
    license: 'MIT or Apache-2.0, no seats, no telemetry',
    renders: 'Its own renderer on the CPU or the GPU, no browser',
    bestFor:
      'Explainers, code walkthroughs, charts and release videos written by an agent and rendered in CI',
    watchOut: 'Pre-1.0: the API still changes. No HTML, CSS or Lottie in the frame.',
  },
  {
    name: 'HyperFrames',
    vs: 'hyperframes',
    url: 'https://github.com/heygen-com/hyperframes',
    what: 'HeyGen’s framework for video as an HTML page: elements with data-start and data-duration, motion from GSAP, CSS, Lottie or Three.js.',
    license: 'Apache-2.0',
    renders: 'Headless Chrome through Puppeteer, encoded by FFmpeg',
    bestFor: 'Videos built from web content, and teams whose agents write HTML',
    watchOut: 'Needs Node.js 22+, FFmpeg and Chrome; the CLI records anonymous render telemetry.',
  },
  {
    name: 'Revideo',
    vs: 'revideo',
    url: 'https://github.com/midrender/revideo',
    what: 'A fork of Motion Canvas turned into a rendering engine: scenes with variables, renderVideo from Node, a React player.',
    license: 'MIT',
    renders: 'A headless browser, in parallel',
    bestFor: 'Templated videos from TypeScript, with a player in a React app',
    watchOut: 'No GitHub releases; counts renders via PostHog unless DISABLE_TELEMETRY=true.',
  },
  {
    name: 'Motion Canvas',
    vs: 'motion-canvas',
    url: 'https://github.com/motion-canvas/motion-canvas',
    what: 'TypeScript animations written as generators, with an editor that previews them in real time.',
    license: 'MIT',
    renders: 'The browser canvas of its editor',
    bestFor: 'Hand-made explainers in TypeScript, rendered from the editor',
    watchOut:
      'Last release v3.17.2 in December 2024; no documented headless render. The Canvas Commons fork continues it.',
  },
  {
    name: 'fframes',
    vs: 'fframes',
    url: 'https://github.com/dmtrKovalenko/fframes',
    what: 'Video in Rust where every frame is an SVG tree returned by a function, with shaders in any layer.',
    license: 'MIT',
    renders: 'Skia on the GPU (Metal, Vulkan) or a CPU backend, with ffmpeg linked in',
    bestFor: 'Generative and shader-heavy video, frame as a pure function',
    watchOut: 'No automatic layout documented; Linux builds need codec development packages.',
  },
  {
    name: 'Manim',
    vs: 'manim',
    url: 'https://github.com/ManimCommunity/manim',
    what: 'The Python library behind the 3Blue1Brown style of math videos, maintained by its community.',
    license: 'MIT',
    renders: 'Cairo, or OpenGL',
    bestFor: 'Math lectures with typeset formulas',
    watchOut: 'Needs Cairo and Pango, and LaTeX for formulas; no timeline editor.',
  },
  {
    name: 'Shotstack, Creatomate, JSON2Video',
    vs: 'cloud-video-apis',
    url: 'https://shotstack.io',
    what: 'Cloud APIs that render a video from a JSON timeline or a template.',
    license: 'Proprietary services',
    renders: 'The vendor’s cloud, billed per minute or credit',
    bestFor: 'Teams that want no install and a template editor for non-developers',
    watchOut: 'A bill per minute of video, and your data in someone else’s cloud.',
  },
];

/** The day the Motion Canvas list was checked against its sources. */
export const MOTION_CANVAS_CHECKED = '2026-10-24';

export const motionCanvasAlternatives: Alternative[] = [
  {
    name: 'oxframe',
    vs: 'motion-canvas',
    url: 'https://github.com/oxygenframe/oxframe-sdk',
    what: 'The Motion Canvas model in Rust: a scene is an async function and every .await is a beat, with signals, layout, a live editor with a timeline, a browser playground, and oxframe check, which reports what is wrong in the frames.',
    license: 'MIT or Apache-2.0',
    renders: 'Its own renderer on the CPU or the GPU, from the CLI and in CI, no browser',
    bestFor: 'Motion Canvas-style explainers that render on a server or are written by an AI agent',
    watchOut: 'Rust instead of TypeScript. Pre-1.0: the API still changes.',
  },
  {
    name: 'Canvas Commons',
    url: 'https://github.com/canvas-commons/canvas-commons',
    what: 'A community fork of Motion Canvas that continues it in TypeScript, with the same generators and editor.',
    license: 'MIT',
    renders: 'The browser canvas of its editor, like Motion Canvas',
    bestFor: 'Staying with Motion Canvas code as it is',
    watchOut: 'Its maintainer calls it not quite release-ready yet.',
  },
  {
    name: 'Revideo',
    vs: 'revideo',
    url: 'https://github.com/midrender/revideo',
    what: 'A fork of Motion Canvas turned into a rendering engine: scenes with variables, renderVideo from Node, a React player.',
    license: 'MIT',
    renders: 'A headless browser, in parallel',
    bestFor: 'Motion Canvas scenes rendered from Node, templated with variables',
    watchOut:
      'No GitHub releases (0.11.0 on npm, July 2026); its team now builds Midrender on it. Counts renders via PostHog unless DISABLE_TELEMETRY=true.',
  },
  {
    name: 'Midrender',
    vs: 'midrender',
    url: 'https://midrender.com',
    what: 'A hosted editor for AI motion graphics from the Revideo team: an agent writes the animation, and you edit it on a timeline with keyframes.',
    license: 'Proprietary service; free plan, Pro $20 a month, Business $100 a month',
    renders: 'A cloud render pipeline',
    bestFor: 'Teams that want a visual timeline next to an AI agent',
    watchOut: 'Not open source; usage is limited by plan.',
  },
  {
    name: 'Remotion',
    vs: 'remotion',
    url: 'https://github.com/remotion-dev/remotion',
    what: 'Video as React components, with a studio, a player and rendering on Lambda.',
    license:
      'Free for individuals, non-profits and companies of up to 3 people; a company license above that',
    renders: 'A React tree in Chrome Headless Shell',
    bestFor: 'Teams that write React and want HTML and CSS in the frame',
    watchOut: 'Seats or per-render fees for larger companies; a different model from generators.',
  },
  {
    name: 'Manim',
    vs: 'manim',
    url: 'https://github.com/ManimCommunity/manim',
    what: 'The Python library behind the 3Blue1Brown style of math videos, maintained by its community.',
    license: 'MIT',
    renders: 'Cairo, or OpenGL',
    bestFor: 'Math lectures with typeset formulas',
    watchOut: 'Needs Cairo and Pango, and LaTeX for formulas; no timeline editor.',
  },
];
