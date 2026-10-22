// /alternatives/remotion: the tools people move to from Remotion, by the
// oxframe team (the page says so). Facts come from the sources of the /vs/*
// pages, checked on CHECKED in src/lib/vs.ts.

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
    watchOut:
      'Pre-1.0: the API still changes. No HTML, CSS or Lottie, and no typeset formulas yet.',
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
