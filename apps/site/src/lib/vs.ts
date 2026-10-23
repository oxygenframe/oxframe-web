// The /vs/* pages: oxframe next to one other tool. Every fact about the other
// tool comes from a source listed on the page and was checked on `CHECKED`;
// render times come from bench/vs/measure.sh (vs-measurements.json). Text
// fields may hold inline HTML (links, <code>), written here, never user input.

/** The day the facts on these pages were checked against their sources. */
export const CHECKED = '2026-10-22';

/** A key of vs-measurements.json: a scene timed in both tools. */
export type BenchKey = 'remotion' | 'hyperframes' | 'revideo' | 'manim';

export interface VsPage {
  slug: string;
  /** The other tool, as its authors write it. */
  name: string;
  /** <title> without " — oxframe". */
  title: string;
  description: string;
  /** First paragraph: when to pick oxframe and when the other tool. */
  lead: string;
  /** Criterion, oxframe, the other tool. */
  rows: [string, string, string][];
  scene?: {
    /** File in lib/migrate with the other tool's code. */
    theirs: string;
    /** The oxframe port in lib/migrate. */
    ours: string;
    bench?: BenchKey;
    intro: string;
  };
  sections: { heading: string; html: string }[];
  /** Code from lib/migrate shown under its own heading, e.g. a batch render. */
  example?: {
    heading: string;
    intro: string;
    files: string[];
    outro: string;
    /** A port in lib/migrate the page opens in the playground. */
    playground?: string;
  };
  pickThem: string[];
  pickOxframe: string[];
  migrate?: string;
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
}

const OXFRAME_SOURCES = [
  { label: 'oxframe license and what leaves your machine', url: 'https://oxframe.dev/license' },
  { label: 'oxframe-sdk on GitHub', url: 'https://github.com/oxygenframe/oxframe-sdk' },
];

export const vsPages: VsPage[] = [
  {
    slug: 'remotion',
    name: 'Remotion',
    title: 'oxframe vs Remotion: no Chrome, no seats, no telemetry',
    description:
      'oxframe vs Remotion, checked October 2026: license and seats, Chrome vs native rendering, agent checks, and one scene timed in both tools.',
    lead: 'Pick oxframe when an AI agent writes the video, it renders in CI, and you want MIT or Apache-2.0 with no seats, per-render fees or telemetry. Pick Remotion when your team lives in React, wants HTML and CSS in the frame, or renders on Lambda at scale.',
    rows: [
      ['Language', 'Rust', 'React (TypeScript or JavaScript)'],
      [
        'How a frame is drawn',
        'Native renderer, CPU or GPU',
        'A React tree in Chrome Headless Shell',
      ],
      [
        'License',
        'MIT or Apache-2.0',
        'Free for individuals, non-profits and companies of up to 3 people; a company license above that',
      ],
      [
        'Price for a team of 10',
        '$0',
        '$25 per seat a month on the Creators plan, or $0.01 per render with a $100 monthly minimum',
      ],
      [
        'Telemetry',
        'None',
        'On by default for client-side rendering; mandatory for the Automators plan from Remotion 5.0',
      ],
      [
        'Install',
        'Rust and ffmpeg',
        'Node.js; Chrome Headless Shell is downloaded on first render',
      ],
      ['Live preview', '<code>oxframe dev</code>: timeline, markers, tunables', 'Remotion Studio'],
      [
        'An agent sees the frames',
        '<code>oxframe check</code>: a storyboard and a JSON report of 15 rules, plus an MCP server',
        'Agent skills; the agent renders stills to look at',
      ],
      ['Frame shapes', '16:9, 9:16 and 1:1 from one scene', 'One size per composition'],
      [
        'Parallel rendering',
        '<code>render --jobs N</code>, the same bytes for any N',
        'Concurrency on one machine, Lambda and Cloud Run',
      ],
      ['HTML, CSS, Lottie', 'No', 'Yes'],
      ['Maturity', 'Pre-1.0, the API still changes', 'Version 4, years in production'],
    ],
    scene: {
      theirs: 'remotion.tsx.txt',
      ours: 'remotion.rs',
      bench: 'remotion',
      intro:
        'The scene from the <a href="/docs/migrate/remotion">Remotion migration guide</a>: a title that springs in and a counter that runs from 0 to 100 %. Four seconds at 1080p and 30 fps.',
    },
    sections: [
      {
        heading: 'The license, as of Remotion 4 and 5',
        html: `<p>Remotion is source-available, not open source. Its <a href="https://www.remotion.pro/license">pricing page</a> says it is free for individuals and companies of up to three people; the <a href="https://www.remotion.dev/docs/license/faq">license FAQ</a> adds non-profits and evaluation. Above three people, counting all personnel whether or not they write Remotion code, a company license is required.</p>
<p>The company license has two shapes: <strong>Remotion for Creators</strong> at $25 per seat a month, where a seat is a person writing Remotion code or driving an agent that does, and <strong>Remotion for Automators</strong> at $0.01 per render with a $100 monthly minimum. Enterprise starts at $500 a month.</p>
<p>The <a href="https://www.remotion.dev/docs/terms">terms for Remotion 5.0</a> take effect when 5.0 is released. Under them, Automators customers render with a license key that sends an event for each render (IP address, domain, production or development, video or still). If that telemetry is blocked, they must send Remotion a monthly verifiable report of their renders. Client-side rendering already has telemetry that cannot be turned off; server-side telemetry stays voluntary for free users and Creators.</p>
<p>oxframe is MIT or Apache-2.0, at your choice. There are no seats, no render counts and no telemetry in the CLI or the SDK; <a href="/license">what leaves your machine</a> is listed on its own page.</p>`,
      },
      {
        heading: 'What the difference means for an agent',
        html: `<p>Both tools let a coding agent write a video, and in both the agent works blind until it sees a frame. With Remotion the agent renders stills and reads them. With oxframe, <code>oxframe check</code> renders a storyboard of the whole video on the CPU and writes a JSON report: text running out of its box, low contrast, a caption outside the safe area, a move too fast to read. Each problem points at the node and the time, with a link to <a href="/docs/check-rules">the rule and its fix</a>. An agent reads the report, fixes the line, runs check again.</p>
<p>The render is the other half. Remotion drives a browser for each frame; oxframe draws the frame itself, so the same scene renders without Chrome, in seconds, on a free CI runner. That is what <a href="https://github.com/oxygenframe/release-video-action">release-video-action</a> does for every oxframe release.</p>`,
      },
    ],
    pickThem: [
      'Your team already writes React and wants components, CSS and HTML in the frame.',
      'You need Lottie, web fonts from CSS, or anything a browser can draw.',
      'You render at scale on Lambda or Cloud Run and want a mature toolkit for it.',
      'You fit the free license: an individual, a non-profit or a company of up to three people.',
    ],
    pickOxframe: [
      'An AI agent writes the scenes and should check its own frames before you look.',
      'Renders run in CI or on a laptop without a browser, a seat count or a render meter.',
      'One scene should give 16:9, 9:16 and 1:1 without three compositions.',
      'You want byte-identical renders: the same code gives the same file.',
    ],
    migrate:
      'The <a href="/docs/migrate/remotion">Remotion migration guide</a> maps <code>useCurrentFrame</code>, <code>interpolate</code>, <code>spring</code> and <code>Sequence</code> to oxframe and ports the scene above line by line. The <code>remotion-to-oxframe</code> skill does the same for an agent.',
    faq: [
      {
        q: 'Is oxframe free for companies?',
        a: 'Yes. oxframe is MIT or Apache-2.0: any company of any size can use it, ship it and render with it, with no seats, no per-render fee and no account.',
      },
      {
        q: 'Do I need Remotion for Automators to render in CI?',
        a: 'With Remotion, a company above three people needs a company license, and Automators is the per-render option ($0.01 a render, $100 a month minimum). With oxframe, a CI render costs only the runner time.',
      },
      {
        q: 'Does oxframe use a browser to render?',
        a: 'No. oxframe draws frames with its own renderer on the CPU or the GPU and pipes them to ffmpeg. The browser playground compiles the same scene to WebAssembly, but rendering a video needs no browser.',
      },
      {
        q: 'Can I use React components in oxframe?',
        a: 'No. oxframe scenes are Rust. Components such as TitleCard, BulletList, CodeExplainer and LowerThird cover the common parts of explainer and release videos, and you can write your own nodes.',
      },
      {
        q: 'Is oxframe faster than Remotion?',
        a: 'On the scene above, on one laptop, yes; the times and the script are on this page. Remotion bundles the project and starts Chrome on every render, which a short video feels most. Run bench/vs/measure.sh to time it on your machine.',
      },
      {
        q: 'Can an agent move a Remotion project to oxframe?',
        a: 'Yes, scene by scene. The remotion-to-oxframe skill and the migration guide map the Remotion API to oxframe; things a browser draws, such as arbitrary HTML and CSS or Lottie, do not carry over.',
      },
    ],
    sources: [
      { label: 'Remotion pricing', url: 'https://www.remotion.pro/license' },
      { label: 'Remotion license FAQ', url: 'https://www.remotion.dev/docs/license/faq' },
      { label: 'Remotion terms (v5.0)', url: 'https://www.remotion.dev/docs/terms' },
      { label: 'Remotion on GitHub', url: 'https://github.com/remotion-dev/remotion' },
      ...OXFRAME_SOURCES,
    ],
  },
  {
    slug: 'hyperframes',
    name: 'HyperFrames',
    title: 'oxframe vs HyperFrames: HTML video or a native timeline',
    description:
      'oxframe vs HyperFrames by HeyGen, checked October 2026: HTML and GSAP in Chrome vs a native Rust renderer, agent tooling, telemetry, and one scene timed in both.',
    lead: 'Pick oxframe when the video is motion graphics an agent should check and render in seconds without a browser. Pick HyperFrames when the video is a web page: HTML, CSS, GSAP, Lottie or Three.js you already have, rendered in headless Chrome.',
    rows: [
      ['Language', 'Rust', 'HTML, CSS and JavaScript (GSAP, Anime.js, WAAPI, Lottie, Three.js)'],
      [
        'How a frame is drawn',
        'Native renderer, CPU or GPU',
        'Headless Chrome through Puppeteer, encoded by FFmpeg',
      ],
      ['License', 'MIT or Apache-2.0', 'Apache-2.0'],
      ['Telemetry', 'None', 'Anonymous render telemetry in the CLI'],
      ['Install', 'Rust and ffmpeg', 'Node.js 22+ and FFmpeg; Chrome is driven through Puppeteer'],
      [
        'Timing model',
        'Signals and an async timeline: <code>wait_for</code>, <code>all</code>, markers',
        '<code>data-start</code> and <code>data-duration</code> on elements, plus a paused GSAP timeline',
      ],
      [
        'Live preview',
        '<code>oxframe dev</code>: timeline, markers, tunables',
        '<code>hyperframes preview</code> with live reload, and Studio',
      ],
      [
        'An agent sees the frames',
        '<code>oxframe check</code>: storyboard and JSON report, MCP server',
        '<code>hyperframes check</code>, skills and a Claude Code plugin',
      ],
      ['Frame shapes', '16:9, 9:16 and 1:1 from one scene', 'Resolution presets per project'],
      [
        'Parallel rendering',
        '<code>render --jobs N</code>, the same bytes for any N',
        'Parallel Chrome workers, about 256 MB each',
      ],
      ['Web content in the frame', 'No', 'Anything a page can show'],
    ],
    scene: {
      theirs: 'hyperframes.html.txt',
      ours: 'remotion.rs',
      bench: 'hyperframes',
      intro:
        'The scene from the <a href="/docs/migrate/remotion">Remotion migration guide</a>, written for HyperFrames as HTML and GSAP: a title that rises in and a counter from 0 to 100 %. Four seconds at 1080p and 30 fps.',
    },
    sections: [
      {
        heading: 'A page that is filmed, or a scene that is drawn',
        html: `<p>HyperFrames, from HeyGen, treats a video as an HTML page with a timeline. Elements carry <code>data-start</code> and <code>data-duration</code>, a paused GSAP timeline holds the motion, and the renderer seeks the page frame by frame in headless Chrome before FFmpeg encodes it. Anything a browser can show can be in the video, and an agent that writes web pages already knows how to write one.</p>
<p>oxframe draws the frame itself. A scene is Rust code with signals: a title, a list, a chart, a code block, each a node with properties that animate in an async timeline. There is no page to lay out and no browser to start, so the same scene renders in a fraction of the time, and the render is reproducible: byte-for-byte on the CPU renderer, visually identical (ΔE ≤ 1) on the GPU.</p>
<p>The trade is plain. HyperFrames wins when the content is web content. oxframe wins when the content is motion graphics, the render runs in CI, and an agent has to check its own frames: <code>oxframe check</code> reports overflowing text, contrast, safe areas and motion that is too fast to read, with the node and the time of each problem.</p>`,
      },
    ],
    pickThem: [
      'The video reuses web content: HTML, CSS, Tailwind, Lottie or Three.js.',
      'Your agent works best in HTML and you do not want a compiled language.',
      'You want a large catalog of ready blocks and HeyGen in the pipeline.',
    ],
    pickOxframe: [
      'Renders should take seconds and run without Chrome, on a laptop or a free CI runner.',
      'An agent should get a report of what is wrong in the frames, not just a video.',
      'You want no telemetry at all and byte-identical renders.',
      'One scene should give 16:9, 9:16 and 1:1.',
    ],
    migrate:
      'There is no HyperFrames guide yet. The <a href="/docs/migrate/remotion">Remotion guide</a> covers the same ideas (a timeline of elements that fade, move and count) and the scene above is the same scene in both.',
    faq: [
      {
        q: 'Is HyperFrames open source?',
        a: 'Yes, Apache-2.0, with no per-render fees. oxframe is MIT or Apache-2.0. Both are free for companies; the difference is the renderer and the tooling, not the license.',
      },
      {
        q: 'Does HyperFrames need Chrome?',
        a: 'Yes. Its README says the renderer seeks each frame in headless Chrome and encodes with FFmpeg; it needs Node.js 22+ and FFmpeg. oxframe needs Rust and ffmpeg and no browser.',
      },
      {
        q: 'Which one is easier for an AI agent?',
        a: 'An agent writes HTML more fluently than Rust, which favors HyperFrames on the first draft. oxframe gives the agent a check: a storyboard and a JSON report of what is wrong, with the node and the time, so it can fix a frame without a human looking.',
      },
      {
        q: 'Does oxframe collect telemetry?',
        a: 'No. Neither the CLI nor the SDK sends anything. The browser playground compiles your scene on compile.oxframe.dev; nothing else leaves your machine.',
      },
      {
        q: 'Can oxframe render HTML or Lottie?',
        a: 'No. oxframe draws shapes, text, code, SVG, images, video clips, charts and 3D meshes. For web content, HyperFrames or Remotion is the better fit.',
      },
    ],
    sources: [
      { label: 'HyperFrames on GitHub', url: 'https://github.com/heygen-com/hyperframes' },
      { label: 'HyperFrames docs', url: 'https://hyperframes.heygen.com' },
      { label: 'hyperframes on npm', url: 'https://www.npmjs.com/package/hyperframes' },
      ...OXFRAME_SOURCES,
    ],
  },
  {
    slug: 'fframes',
    name: 'fframes',
    title: 'oxframe vs fframes: two Rust video engines compared',
    description:
      'oxframe vs fframes, checked October 2026: both render video from Rust; how a frame is built, layout, agent checks, install and when each one fits.',
    lead: 'Pick oxframe when you want layout, themes and components so an agent writes less, plus a check of the frames and a playground in the browser. Pick fframes when every frame should be a pure function returning SVG, with Skia on the GPU and shaders in any layer.',
    rows: [
      ['Language', 'Rust', 'Rust'],
      [
        'How a frame is built',
        'Nodes that stay linked: signals, layout, <code>bind</code>',
        'A function of the frame index returning an SVG tree (<code>svgr!</code>)',
      ],
      [
        'Renderer',
        'Own renderer, CPU (tiny-skia) or GPU (wgpu)',
        'Skia on the GPU (Metal, Vulkan) or a CPU backend',
      ],
      [
        'Layout',
        'Rows, columns, <code>next_to</code>, <code>to_edge</code>, text wrapping',
        'Positions as SVG attributes; no automatic layout documented',
      ],
      [
        'Themes and components',
        'Theme tokens; TitleCard, BulletList, CodeExplainer, LowerThird and more',
        'Your own SVG',
      ],
      ['Encoding', 'Pipes frames to ffmpeg', 'Links ffmpeg libav statically'],
      [
        'Install',
        'Rust and ffmpeg',
        'Rust plus codec development packages (x264, x265, opus, clang); prebuilt Skia and ffmpeg on macOS and Linux',
      ],
      [
        'Preview',
        '<code>oxframe dev</code>, and a playground in the browser',
        'A GPU preview window and a WebAssembly editor',
      ],
      [
        'An agent sees the frames',
        '<code>oxframe check</code> with a JSON report, MCP server, 12 skills',
        'A skill and a CLI: <code>inspect</code>, <code>strip</code>, <code>frame</code>, <code>timeline</code>',
      ],
      ['Shaders', 'WGSL shader nodes and effects', 'SkSL or Shadertoy GLSL in any layer'],
      ['License', 'MIT or Apache-2.0', 'MIT'],
    ],
    sections: [
      {
        heading: 'Two models of a frame',
        html: `<p>fframes asks one question per frame: given this index, what is the SVG? A scene implements a <code>Video</code> trait with <code>render_frame</code>, and the <code>svgr!</code> macro writes the SVG tree. That makes any frame cheap to reach and easy to reason about, and Skia on the GPU draws it fast. Its README reports a 128-second video rendered in 36 seconds.</p>
<p>oxframe keeps a scene graph. A title is a node; its opacity, position and text are signals that animate over time and can be bound to each other, so a label follows a point and a card grows with its text. Layout places nodes in rows and columns and wraps text, and components bundle the parts of an explainer. The agent writes "a bullet list next to the chart" instead of computing coordinates, which is less code to write and less to get wrong.</p>
<p>Both give an agent a way to look at the video without playing it. fframes has <code>inspect</code>, <code>strip</code> and <code>frame</code> commands; oxframe has <code>check</code>, which applies 15 rules (overflow, contrast, safe area, motion speed and more) and points at the node and the time of each problem.</p>`,
      },
      {
        heading: 'Getting started, side by side',
        html: `<p>fframes, from its README:</p>
<pre><code>cargo install --locked cargo-fframes --git https://github.com/dmtrKovalenko/fframes
cargo fframes new my-video</code></pre>
<p>On Debian and Ubuntu it first needs <code>yasm nasm ffmpeg libx264-dev libx265-dev libopus-dev libclang-dev clang ninja-build libvpx-dev libasound2-dev</code>; prebuilt Skia and ffmpeg libraries are downloaded on macOS and Linux, and other targets build them from source.</p>
<p>oxframe:</p>
<pre><code>cargo install oxframe-cli
oxframe init my-video
cd my-video && oxframe dev</code></pre>
<p>It needs Rust and an ffmpeg binary on the PATH to write MP4; nothing else is compiled from source. Or skip the install and open the <a href="/playground">playground</a>.</p>
<p>We have not timed the same scene in both: fframes needs those codec development packages, which the benchmark machine does not have. When it does, the numbers and the script will be on this page, as they are for <a href="/vs/remotion">Remotion</a> and <a href="/vs/manim">Manim</a>.</p>`,
      },
      {
        heading: 'Rendering and scale',
        html: `<p>Both engines skip the browser, so both are fast. fframes draws each frame with Skia on the GPU and links ffmpeg's libav statically; its README reports a 128-second video rendered in 36 seconds. oxframe draws with its own renderer — tiny-skia on the CPU or wgpu on the GPU — and pipes frames to an ffmpeg binary on the PATH.</p>
<p>Where oxframe leans on scale is the CLI. <code>oxframe render --jobs N</code> splits the video into two-second segments, renders them in parallel processes and joins them without re-encoding, and the output bytes are identical for any N — so a render is reproducible, and the same scene gives the same file on a laptop and in CI. The <a href="/">home page</a> times a 27.5-second explainer at 8.4 seconds on eight jobs.</p>`,
      },
      {
        heading: 'Writing the video with an agent',
        html: `<p>Both projects expect a coding agent to write the scene, and both let it look at the result without playing the whole video — fframes with <code>inspect</code>, <code>strip</code> and <code>frame</code>, oxframe with <code>oxframe check</code>. The difference is what the agent gets back. <code>check</code> renders a storyboard and writes a JSON report that applies 15 rules — text out of its box, low contrast, a caption outside the safe area, a motion too fast to read — and points each problem at the node and the time, with a <a href="/docs/check-rules">link to the rule and its fix</a>. oxframe also ships <a href="/agents">12 skills, a Claude Code plugin and an MCP server</a>, so the agent has the API and the components in front of it. With layout, themes and those components, the agent writes "a bullet list next to the chart" rather than coordinates, which is less code for it to get wrong.</p>`,
      },
    ],
    pickThem: [
      'You think of a frame as a pure function and want SVG as the drawing model.',
      'You want Shadertoy shaders in any layer and Skia on the GPU.',
      'You are happy to place everything yourself.',
    ],
    pickOxframe: [
      'An agent should write layout, not coordinates: rows, columns, wrapping text, themes.',
      'You want ready components for titles, lists, code and charts.',
      'You want a JSON report of what is wrong in the frames, an MCP server and a browser playground.',
      'Install should be Rust and ffmpeg, without codec development packages.',
    ],
    faq: [
      {
        q: 'Are oxframe and fframes both written in Rust?',
        a: 'Yes, and both render natively without a browser. They differ in how a frame is described: fframes returns an SVG tree per frame, oxframe animates a graph of nodes with signals and layout.',
      },
      {
        q: 'Does fframes have automatic layout?',
        a: 'Its README places elements with SVG attributes such as x, y, width and height and does not document flexbox, grid or text wrapping. oxframe has rows, columns, relative placement and wrapping text.',
      },
      {
        q: 'Which one renders faster?',
        a: 'Both are fast; neither starts a browser. We have not timed the same scene in both yet. When we do, the numbers will be on this page with the script.',
      },
      {
        q: 'Do both work with coding agents?',
        a: 'Yes. fframes ships a skill and an inspection CLI. oxframe ships 12 skills, a Claude Code plugin, an MCP server and oxframe check, whose report links every problem to its fix.',
      },
      {
        q: 'Can I preview a scene without rendering the whole video?',
        a: 'Both can. fframes has a GPU preview window and a WebAssembly editor; oxframe has oxframe dev with a timeline and markers, and a browser playground with nothing to install. Any single frame is cheap to reach in both.',
      },
      {
        q: 'Does oxframe render in parallel like fframes is fast?',
        a: 'Both render without a browser. oxframe adds oxframe render --jobs N, which renders two-second segments in parallel processes and joins them without re-encoding; the bytes are identical for any N, so the result is reproducible in CI.',
      },
      {
        q: 'Which license?',
        a: 'fframes is MIT. oxframe is MIT or Apache-2.0, at your choice.',
      },
    ],
    sources: [
      { label: 'fframes site', url: 'https://fframes.studio' },
      { label: 'fframes on GitHub', url: 'https://github.com/dmtrKovalenko/fframes' },
      { label: 'fframes on docs.rs', url: 'https://docs.rs/fframes' },
      ...OXFRAME_SOURCES,
    ],
  },
  {
    slug: 'manim',
    name: 'Manim',
    title: 'oxframe vs Manim: math animation with a live editor',
    description:
      'oxframe vs Manim Community, checked October 2026: install, editor, plots and transforms, formulas, agent checks, and one scene timed in both tools.',
    lead: 'Pick oxframe when you want a live editor with a timeline, a browser playground with nothing to install, and video, sound and charts in one scene. Pick Manim when the video is a math lecture with typeset formulas, or the Python ecosystem around it is the point.',
    rows: [
      ['Language', 'Rust', 'Python'],
      ['Renderer', 'Own renderer, CPU or GPU', 'Cairo, or OpenGL'],
      [
        'Install',
        'Rust and ffmpeg; or nothing, in the browser playground',
        'Python with Cairo and Pango; LaTeX for formulas',
      ],
      ['Formulas', 'Not yet: no LaTeX or Typst', 'LaTeX, and Typst as an optional extra'],
      [
        'Plots and axes',
        '<code>Axes</code>, <code>plot</code>, <code>point_on</code>, bars, scatter',
        '<code>Axes</code>, <code>plot</code>, <code>ValueTracker</code>, many more',
      ],
      [
        'Morphing shapes',
        'Any path into any path, and text',
        '<code>Transform</code> between mobjects',
      ],
      ['Editor', '<code>oxframe dev</code>: timeline, markers, tunables', 'No timeline editor'],
      [
        'Sound and voice',
        'Mixer, sounds on cues, TTS synced to words',
        'Plugins (manim-voiceover)',
      ],
      [
        'An agent sees the frames',
        '<code>oxframe check</code> with a JSON report, MCP server',
        'You wire that yourself',
      ],
      ['Frame shapes', '16:9, 9:16 and 1:1 from one scene', 'The scene size'],
      ['License', 'MIT or Apache-2.0', 'MIT'],
      ['Community', 'New', 'Large: 3Blue1Brown style, years of examples'],
    ],
    scene: {
      theirs: 'manim.py.txt',
      ours: 'manim.rs',
      bench: 'manim',
      intro:
        'The two scenes from the <a href="/docs/migrate/manim">Manim migration guide</a>: a circle drawn on and turned into a square, then a sine curve with a dot that rides it. 1080p at 60 fps.',
    },
    sections: [
      {
        heading: 'Where each one is strong',
        html: `<p>Manim is the tool behind the 3Blue1Brown style, and its community has years of scenes, plugins and answers. If the video is about equations, Manim's LaTeX and Typst support is the reason to use it: oxframe does not typeset formulas yet.</p>
<p>oxframe's case is the workflow around the scene. <code>oxframe dev</code> shows the video with a timeline, markers you drag to retime it, and tunables you change without rebuilding; the <a href="/playground">playground</a> runs the same scene in a browser with nothing to install. One scene can hold a plot, a code block, a video clip and a voice line, and render 16:9, 9:16 and 1:1. And <code>oxframe check</code> tells an agent what is wrong in a frame before you watch it.</p>
<p>Cairo is quick on simple scenes; most of the gap below is start-up and encoding. Manim's real cost is its install, which the playground avoids altogether.</p>`,
      },
      {
        heading: 'How the code maps',
        html: `<table>
<thead><tr><th>Manim</th><th>oxframe</th></tr></thead>
<tbody>
<tr><td><code>class S(Scene): def construct(self)</code></td><td><code>#[oxframe::scene] async fn s(view: View)</code></td></tr>
<tr><td><code>self.add(m)</code></td><td><code>view.add(…)</code></td></tr>
<tr><td><code>self.play(Create(m))</code></td><td><code>m.draw_on().await</code></td></tr>
<tr><td><code>FadeIn</code>, <code>FadeOut</code></td><td><code>m.fade_in().await</code>, <code>m.fade_out().await</code></td></tr>
<tr><td><code>Transform(a, b)</code></td><td><code>a.data().to(path, 1.0)</code> for shapes, <code>t.morph_to("new", 1.0)</code> for text</td></tr>
<tr><td><code>self.play(a, b)</code></td><td><code>all((a, b)).await</code></td></tr>
<tr><td><code>LaggedStart(…, lag_ratio=0.1)</code></td><td><code>stagger(0.1, &amp;items, |m| m.fade_in()).await</code></td></tr>
<tr><td><code>ValueTracker</code>, <code>always_redraw</code></td><td><code>Signal::new(…)</code>, <code>.bind(move || …)</code></td></tr>
<tr><td><code>Axes</code>, <code>axes.plot</code>, <code>NumberLine</code></td><td><code>Axes::new()</code>, <code>axes.plot(|x| …)</code>, <code>NumberLine::new(…)</code></td></tr>
<tr><td><code>Matrix</code>, <code>Vector</code>, <code>ApplyMatrix</code></td><td><code>Matrix::new</code>, <code>axes.vector</code>, <code>axes.apply_matrix</code></td></tr>
<tr><td><code>MovingCameraScene</code></td><td><code>Camera</code>: zoom, <code>center_on</code>, <code>fit</code></td></tr>
<tr><td><code>MathTex</code>, <code>Tex</code></td><td>not yet</td></tr>
</tbody>
</table>`,
      },
    ],
    example: {
      heading: 'A scene in the style of 3Blue1Brown',
      intro:
        'From chapter 3 of <em>Essence of linear algebra</em>: î lands on (1, −2) and ĵ on (3, 0), so v = −1 î + 2 ĵ lands on (5, 2). The grid, the basis vectors and v follow the matrix; the matrix shows where the basis vectors land.',
      files: ['essence.rs'],
      outro:
        'It runs in the browser with nothing to install. Change the matrix and watch the plane follow.',
      playground: 'essence',
    },
    pickThem: [
      'The video is about formulas and needs LaTeX or Typst.',
      'You write Python and want its scientific libraries in the scene.',
      'You want the 3Blue1Brown look and the largest set of examples to learn from.',
    ],
    pickOxframe: [
      'You want a timeline editor, or a playground in the browser with nothing to install.',
      'The video mixes plots with code, clips, sound and a voice.',
      'An agent writes the scenes and should check them itself.',
      'You need vertical and square versions of the same scene.',
    ],
    migrate:
      'The <a href="/docs/migrate/manim">Manim migration guide</a> maps <code>Scene</code>, <code>self.play</code>, <code>Transform</code>, <code>Axes</code> and <code>ValueTracker</code> to oxframe and ports both scenes above. Formulas do not carry over yet.',
    faq: [
      {
        q: 'Can oxframe render LaTeX formulas?',
        a: 'Not yet. Typst formulas are planned but postponed while their cost to the browser playground is weighed. For formula-heavy videos, Manim is the better fit today.',
      },
      {
        q: 'Do I need to install anything to try oxframe?',
        a: 'No. The playground on oxframe.dev compiles and plays a scene in the browser. To render video locally you need Rust and ffmpeg.',
      },
      {
        q: 'What does Manim need installed?',
        a: 'Python with Cairo and Pango development libraries (pkg-config, cairo and pango on Linux and macOS) and, for typeset formulas, a LaTeX distribution. Typst support is an optional Python extra.',
      },
      {
        q: 'Does oxframe have something like ValueTracker?',
        a: 'Yes: signals. A Signal holds a value that animates over time, and other properties can be bound to it, as the dot bound to the sine curve in the scene above.',
      },
      {
        q: 'Is oxframe faster than Manim?',
        a: "On the guide scenes on one laptop, oxframe is faster; the numbers and the script are on this page. For long scenes with many objects, measure your own: Manim's OpenGL renderer and caching change the picture.",
      },
      {
        q: 'Can I make a 3Blue1Brown-style video in oxframe?',
        a: 'The parts are there: axes, plots, morphing paths, a moving camera, transforms of the plane. Typeset formulas are the missing piece.',
      },
    ],
    sources: [
      { label: 'Manim Community on GitHub', url: 'https://github.com/ManimCommunity/manim' },
      { label: 'Manim releases', url: 'https://github.com/ManimCommunity/manim/releases' },
      {
        label: 'Manim installation',
        url: 'https://docs.manim.community/en/stable/installation.html',
      },
      ...OXFRAME_SOURCES,
    ],
  },
  {
    slug: 'motion-canvas',
    name: 'Motion Canvas',
    title: 'oxframe vs Motion Canvas: same model, renders anywhere',
    description:
      'oxframe vs Motion Canvas, checked October 2026: signals and generators, the editor, server rendering, project activity, and how a scene moves over.',
    lead: 'Pick oxframe when you like the Motion Canvas model (signals, a timeline you write as code, an editor) but need server rendering, an active project and agent checks. Pick Motion Canvas when you want TypeScript and its browser editor is all the rendering you need.',
    rows: [
      ['Language', 'Rust', 'TypeScript'],
      [
        'Animation model',
        'Async scene: <code>.await</code>, <code>all</code>, signals',
        'Generator scene: <code>yield*</code>, <code>all</code>, signals',
      ],
      ['Renderer', 'Native, CPU or GPU', 'Browser canvas in the editor'],
      ['Render without a browser', 'Yes, CLI and CI', 'Not documented'],
      [
        'Editor',
        '<code>oxframe dev</code>: timeline, markers, tunables',
        'Editor with real-time preview and timeline',
      ],
      ['Layout', 'Rows, columns, relative placement, wrapping text', 'Flexbox layout'],
      ['Latest release', '0.20.4, October 2026', 'v3.17.2, December 2024'],
      [
        'An agent sees the frames',
        '<code>oxframe check</code> with a JSON report, MCP server',
        'You wire that yourself',
      ],
      ['License', 'MIT or Apache-2.0', 'MIT'],
    ],
    scene: {
      theirs: 'motion-canvas.tsx.txt',
      ours: 'motion-canvas.rs',
      intro:
        'The scene from the <a href="/docs/migrate/motion-canvas">Motion Canvas migration guide</a>. Motion Canvas renders from its editor in the browser, so this page has no timed render for it.',
    },
    sections: [
      {
        heading: 'Familiar code, a different runtime',
        html: `<p>Motion Canvas got the model right: a scene is code that reads top to bottom, properties are signals, and <code>all</code> and <code>chain</code> compose animations. oxframe uses the same ideas with Rust's <code>async</code> in place of generators, so a Motion Canvas scene ports almost line for line.</p>
<p>The difference is around the scene. Motion Canvas renders in its browser editor; its README describes a library and an editor, and no headless path. Its last release, v3.17.2, came out in December 2024, and its main branch has had one commit since February 2025. oxframe renders from the CLI on any machine, in parallel and byte-identical, and is released every few days.</p>
<p>The <a href="https://github.com/canvas-commons/canvas-commons">Canvas Commons</a> fork continues Motion Canvas in TypeScript, and <a href="/vs/revideo">Revideo</a> forked it for headless rendering.</p>`,
      },
      {
        heading: 'How the code maps',
        html: `<p>Most of a Motion Canvas scene has a direct counterpart; durations are seconds in both.</p>
<table>
<thead><tr><th>Motion Canvas</th><th>oxframe</th></tr></thead>
<tbody>
<tr><td><code>makeScene2D(function* (view) { … })</code></td><td><code>#[oxframe::scene] async fn name(view: View) { … }</code></td></tr>
<tr><td><code>yield* node().x(300, 1)</code></td><td><code>node.x().to(300.0, 1.0).await</code></td></tr>
<tr><td><code>createRef</code> and <code>ref={…}</code></td><td>the handle that <code>view.add(…)</code> returns</td></tr>
<tr><td><code>createSignal(0)</code>, <code>() =&gt; …</code></td><td><code>Signal::new(0.0)</code>, <code>.bind(move || …)</code></td></tr>
<tr><td><code>all(…)</code>, <code>chain(…)</code></td><td><code>all((…)).await</code>; awaits one after another</td></tr>
<tr><td><code>waitFor(1)</code>, <code>waitUntil('event')</code></td><td><code>wait_for(1.0)</code>, <code>wait_until("event")</code></td></tr>
<tr><td><code>&lt;Layout direction="column" gap={20}&gt;</code></td><td><code>Layout::new().column().gap(20.0)</code></td></tr>
<tr><td><code>&lt;Code&gt;</code> with edits and selection</td><td><code>Code</code> with <code>.code().to(next, s)</code>, <code>insert</code>, <code>replace</code>, <code>focus_lines</code></td></tr>
<tr><td><code>slideTransition(Direction.Left)</code></td><td><code>transition(Transition::slide(Dir::Left)).await</code></td></tr>
<tr><td><code>beginSlide('name')</code> and the presenter</td><td><code>slide_break().await</code> and <code>oxframe present</code></td></tr>
<tr><td>rendering from the editor</td><td><code>oxframe render</code>, headless</td></tr>
</tbody>
</table>`,
      },
      {
        heading: 'What does not carry over',
        html: `<ul>
<li><strong>LaTeX.</strong> There is no formula node in oxframe yet.</li>
<li><strong>Custom TSX components.</strong> A component made of other nodes becomes a Rust function that adds them to a <code>Group</code>; a node that draws itself uses the <a href="/docs/custom-nodes">node API</a>.</li>
<li><strong>Editor plugins.</strong> oxframe's editor is not extensible yet.</li>
</ul>
<p>The editor itself carries over in spirit: <code>oxframe dev</code> plays the scene with a timeline, and markers keep their names, so a ported scene can be retimed by dragging them back into place.</p>`,
      },
    ],
    pickThem: [
      'You want TypeScript and the browser editor, and render by hand from it.',
      'You already have a Motion Canvas project and it does what you need.',
    ],
    pickOxframe: [
      'You want the same model with rendering in CI and on a server.',
      'An agent writes the scenes and should check its own frames.',
      'You want a mixer, voice lines synced to words, video clips and 3D in the scene.',
      'You want a project with regular releases.',
    ],
    migrate:
      'The <a href="/docs/migrate/motion-canvas">Motion Canvas migration guide</a> maps <code>makeScene2D</code>, <code>yield*</code>, refs, signals and <code>all</code> to oxframe, and the <code>motion-canvas-to-oxframe</code> skill ports a scene for an agent.',
    faq: [
      {
        q: 'Is Motion Canvas still maintained?',
        a: 'Its last release is v3.17.2 from December 2024, and its main branch has had one commit (a docs domain change in July 2026) since February 2025. The Canvas Commons fork continues it.',
      },
      {
        q: 'Can Motion Canvas render on a server?',
        a: 'Its README describes a library and an editor with a real-time preview, and no headless render. Revideo, a fork, added headless rendering. oxframe renders from the CLI.',
      },
      {
        q: 'How close is the oxframe API to Motion Canvas?',
        a: 'Close: signals, all, waitFor as wait_for, refs as handles. Generators become async functions, and yield* becomes .await.',
      },
      {
        q: 'Does oxframe have an editor like Motion Canvas?',
        a: 'Yes: oxframe dev shows the video with a timeline, markers you drag to retime it and tunables you change while it plays.',
      },
      {
        q: 'Do I have to learn Rust?',
        a: 'Some. Scenes read like the TypeScript you know, and the playground runs them in the browser. An agent with the oxframe skill writes most of the Rust for you.',
      },
      {
        q: 'Can I keep my Motion Canvas project and still use oxframe?',
        a: 'Yes. They are separate tools: port scenes one at a time with the motion-canvas-to-oxframe skill and render the ported ones from the CLI, while the rest stay in the Motion Canvas editor until you move them.',
      },
    ],
    sources: [
      { label: 'Motion Canvas on GitHub', url: 'https://github.com/motion-canvas/motion-canvas' },
      {
        label: 'Motion Canvas releases',
        url: 'https://github.com/motion-canvas/motion-canvas/releases',
      },
      {
        label: 'Motion Canvas commits',
        url: 'https://github.com/motion-canvas/motion-canvas/commits/main/',
      },
      { label: 'Canvas Commons', url: 'https://github.com/canvas-commons/canvas-commons' },
      ...OXFRAME_SOURCES,
    ],
  },
  {
    slug: 'revideo',
    name: 'Revideo',
    title: 'oxframe vs Revideo: rendering video from code, compared',
    description:
      'oxframe vs Revideo, checked October 2026: headless browser vs native rendering, variables and templates, telemetry, and one scene timed in both tools.',
    lead: 'Pick oxframe when you want templated videos rendered natively, with no browser and no telemetry, and an agent that checks its own frames. Pick Revideo when you want the Motion Canvas model in TypeScript with a React player and render endpoints out of the box.',
    rows: [
      ['Language', 'Rust', 'TypeScript'],
      ['Origin', 'Its own engine', 'A fork of Motion Canvas'],
      ['Renderer', 'Native, CPU or GPU', 'Headless browser'],
      [
        'Variables per render',
        'Rust values and functions',
        '<code>useScene().variables</code> and <code>renderVideo</code> variables',
      ],
      [
        'Parallel rendering',
        '<code>render --jobs N</code>, the same bytes for any N',
        'Parallelized rendering',
      ],
      ['Player for a web page', 'Playground and editor', 'React <code>&lt;Player/&gt;</code>'],
      [
        'Telemetry',
        'None',
        'Counts rendered videos via PostHog; <code>DISABLE_TELEMETRY=true</code> turns it off',
      ],
      ['Releases', '0.20.4, October 2026', 'No GitHub releases; 0.11.0 on npm'],
      [
        'An agent sees the frames',
        '<code>oxframe check</code> with a JSON report, MCP server',
        'You wire that yourself',
      ],
      ['License', 'MIT or Apache-2.0', 'MIT'],
    ],
    scene: {
      theirs: 'revideo.tsx.txt',
      ours: 'revideo.rs',
      bench: 'revideo',
      intro:
        'The scene from the <a href="/docs/migrate/revideo">Revideo migration guide</a>: a welcome card with a name passed in at render time. Two seconds at 1080p.',
    },
    sections: [
      {
        heading: 'Templated video without a browser',
        html: `<p>Revideo took Motion Canvas and made it a rendering engine: scenes read variables, <code>renderVideo</code> renders a project from Node, and a CLI exposes a render endpoint. Its README says it runs anywhere Node and a headless browser run, including serverless platforms, and that it is the engine behind Midrender. It also counts rendered videos anonymously through PostHog unless <code>DISABLE_TELEMETRY=true</code> is set.</p>
<p>oxframe covers the same job natively. A scene takes its data as Rust values, the CLI renders it in parallel segments, and the bytes do not depend on the machine or the number of jobs. Nothing is sent anywhere. The welcome card below is the same scene in both; the times are on this page.</p>`,
      },
      {
        heading: 'What Revideo adds, in oxframe',
        html: `<p>Revideo's scenes are Motion Canvas scenes, and they port the same way: generators become <code>async fn</code>, <code>yield*</code> becomes <code>.await</code>. What Revideo adds on top maps like this:</p>
<table>
<thead><tr><th>Revideo</th><th>oxframe</th></tr></thead>
<tbody>
<tr><td><code>useScene().variables.get('name', 'Ada')</code></td><td>ordinary Rust: read the value from the environment or a file, or build the project in <code>main</code> from it</td></tr>
<tr><td><code>renderVideo({ projectFile, variables, settings })</code></td><td><code>NAME=Grace oxframe render --out welcome.mp4</code>; a loop renders one video per input</td></tr>
<tr><td>rendering in a headless browser</td><td>no browser: oxframe draws frames itself, on the GPU or with <code>--cpu</code></td></tr>
<tr><td>parallel rendering</td><td><code>oxframe render --jobs 8</code>: 2-second segments in parallel, the same bytes as one job</td></tr>
<tr><td><code>&lt;Audio&gt;</code>, <code>&lt;Video&gt;</code></td><td><code>sound(…).play()</code>, <code>Audio::track(…)</code>, <code>Video</code> (feature <code>video</code>)</td></tr>
<tr><td>the React player</td><td>no published player package yet: share the video or a playground link</td></tr>
</tbody>
</table>
<p>One detail from porting the welcome card: in Revideo 0.11.0 a text given as a function, <code>text={() =&gt; &#96;Welcome, &#36;{name()}&#96;}</code>, rendered an empty frame in our test, while the same text as a string rendered; the guide's code uses the string.</p>`,
      },
    ],
    pickThem: [
      'You want TypeScript and the Motion Canvas model with headless rendering.',
      'You embed a player in a React app and render from Node.',
    ],
    pickOxframe: [
      'Renders should not need a browser and should be byte-identical.',
      'You want no telemetry, with nothing to turn off.',
      'An agent writes or fills the templates and should check the frames.',
      'You want regular releases and a changelog.',
    ],
    migrate:
      'The <a href="/docs/migrate/revideo">Revideo migration guide</a> maps scenes, variables and <code>renderVideo</code> to oxframe and ports the welcome card above.',
    faq: [
      {
        q: 'Is Revideo still developed?',
        a: 'Its README describes it as the engine behind Midrender. It has no GitHub releases; npm has 0.11.0. Check its repository for the current state.',
      },
      {
        q: 'Does Revideo send telemetry?',
        a: 'Its README says it anonymously counts how many videos are rendered, via PostHog, and that DISABLE_TELEMETRY=true disables it. oxframe has no telemetry.',
      },
      {
        q: 'Can oxframe render a video per row of data?',
        a: 'Yes. A scene is a Rust function, so it takes any data you pass it; render one video per row from a loop or a script.',
      },
      {
        q: 'Is there a player for web pages?',
        a: 'Revideo has a React player. oxframe has the playground and the editor; a player to embed in your own page is not available yet.',
      },
      {
        q: 'How hard is it to move from Revideo?',
        a: 'Revideo scenes are Motion Canvas scenes, which map almost line by line: generators become async functions and yield* becomes .await. The migration guide shows one.',
      },
      {
        q: 'Are oxframe renders reproducible for a templated batch?',
        a: 'Yes. oxframe render --jobs N renders segments in parallel and joins them without re-encoding, and the output bytes are identical for any N and on any machine. One video per input re-renders to the same file, which is easy to cache and to diff in CI.',
      },
    ],
    sources: [
      { label: 'Revideo on GitHub', url: 'https://github.com/midrender/revideo' },
      { label: '@revideo/core on npm', url: 'https://www.npmjs.com/package/@revideo/core' },
      ...OXFRAME_SOURCES,
    ],
  },
  {
    slug: 'shotstack',
    name: 'Shotstack',
    title: 'An open-source Shotstack alternative: video from code',
    description:
      'oxframe vs Shotstack, checked October 2026: a JSON edit sent to a cloud API vs a Rust scene rendered on your machine, with prices and a CSV batch example.',
    lead: 'Pick oxframe when you want the video as code in your repository, rendered on your own machine or CI with no per-minute bill. Pick Shotstack when you want a hosted render API, a template editor for non-developers and no install at all.',
    rows: [
      ['How a video is described', 'A Rust scene', 'A JSON edit: a timeline of tracks and clips'],
      ['Where it renders', 'Your machine or your CI', 'Shotstack’s cloud, through a render queue'],
      [
        'Getting the file',
        'It is written to disk',
        'Poll the render by id, then download; output URLs last 24 hours',
      ],
      [
        'Price',
        '$0; your own compute',
        'From $10 for 50 minutes; plans from $39 a month for 250 minutes',
      ],
      [
        'Development',
        'The same renderer everywhere',
        'A <code>stage</code> sandbox; <code>v1</code> renders without watermarks',
      ],
      [
        'Data from outside',
        'Any Rust value: a CSV row, JSON, an API',
        'Templates with merge fields',
      ],
      ['Layout', 'Rows, columns, wrapping text, themes', 'Positions and alignment per clip'],
      [
        'Charts, code, math',
        'Built in: axes, plots, code with diffs, matrices',
        'Images and video you render elsewhere',
      ],
      [
        'An agent sees the frames',
        '<code>oxframe check</code> with a JSON report',
        'Render, download, look',
      ],
      ['Account and key', 'None', 'An API key in the <code>x-api-key</code> header'],
      ['License', 'MIT or Apache-2.0', 'Proprietary service'],
    ],
    scene: {
      theirs: 'shotstack.json.txt',
      ours: 'shotstack.rs',
      intro:
        'The edit from Shotstack’s Hello World guide: “HELLO WORLD” fading in and out over five seconds, with a music track, at 1024 × 576. The Shotstack side is the JSON you POST to <code>/edit/stage/render</code>; the oxframe side is the scene you render with <code>oxframe render</code>. We did not time the Shotstack render: it needs an account, and its time includes the queue.',
    },
    sections: [
      {
        heading: 'What a thousand videos cost',
        html: `<p>Take a thousand 30-second videos a month: 500 minutes of video.</p>
<ul>
<li><strong>Shotstack</strong>, from <a href="https://shotstack.io/pricing/">its pricing page</a> on ${CHECKED}: the Pro plan, $99 a month for 750 minutes, or $100 pay as you go at 20¢ a minute. The Starter plan’s 250 minutes are not enough.</li>
<li><strong>oxframe</strong>: no fee. On a laptop, a 27.5-second explainer renders in 8.4 seconds on 8 jobs (the measurement on <a href="/">the home page</a>), so 500 minutes of similar video take about two and a half hours of one machine. On GitHub Actions that is runner time, free for public repositories.</li>
</ul>
<p>The trade is time and hardware against a bill and a dependency. A hosted API wins when you render rarely or cannot run anything yourself; code wins when you render often, need logic in the video or want the data to stay with you.</p>`,
      },
      {
        heading: 'Moving an edit over',
        html: `<p>A Shotstack edit maps onto a scene almost clip by clip:</p>
<table>
<thead><tr><th>Shotstack</th><th>oxframe</th></tr></thead>
<tbody>
<tr><td>a clip with <code>start</code> and <code>length</code></td><td>a node, with <code>.await</code> and <code>wait_for</code> for time</td></tr>
<tr><td><code>transition: { in: "fade", out: "fade" }</code></td><td><code>fade_in()</code>, <code>fade_out()</code>; scenes change with <code>transition(…)</code></td></tr>
<tr><td><code>rich-text</code> and <code>title</code> assets</td><td><code>Txt</code>, or components such as <code>TitleCard</code> and <code>LowerThird</code></td></tr>
<tr><td><code>image</code> and <code>video</code> assets</td><td><code>Img</code>, <code>Video</code> (feature <code>video</code>)</td></tr>
<tr><td>an <code>audio</code> track</td><td><code>Audio::track(…)</code> with fades and ducking under a voice</td></tr>
<tr><td>merge fields <code>{{NAME}}</code></td><td>a Rust value, read from the environment, a file or <code>main</code></td></tr>
<tr><td><code>output.size</code></td><td><code>Project::size(w, h)</code>, or <code>.aspects(…)</code> for several shapes at once</td></tr>
</tbody>
</table>`,
      },
    ],
    example: {
      heading: 'A video per row of a CSV',
      intro:
        'Where Shotstack fills a template’s merge fields for each request, oxframe reads the row in the scene, and a shell loop renders one video per row.',
      files: ['cloud-csv.rs', 'cloud-csv.sh.txt'],
      outro:
        'Rows are independent, so a CI matrix or <code>xargs -P</code> renders them in parallel. <code>NAME=… oxframe check</code> on the longest name catches a title that does not fit its card before the batch runs.',
    },
    pickThem: [
      'Nobody on the team should install or run a renderer.',
      'Non-developers edit templates in a web editor.',
      'You render a few videos a month and a bill is simpler than a machine.',
    ],
    pickOxframe: [
      'You render many videos and do not want a per-minute bill.',
      'The video needs logic: charts from data, layout that adapts, code walkthroughs.',
      'Data and output should stay on your machine or in your CI.',
      'An agent writes the scene and should check its frames.',
    ],
    faq: [
      {
        q: 'Is oxframe an open-source Shotstack alternative?',
        a: 'For the rendering part, yes: oxframe is MIT or Apache-2.0 and renders on your machine. It is a library and a CLI, not a hosted API, so there is no endpoint to call; you run the render where you want it.',
      },
      {
        q: 'Can I keep my Shotstack JSON?',
        a: 'Not as is. oxframe does not read Shotstack edits; each clip becomes a line or two of a scene, as in the table above. An agent with the oxframe skill can port an edit for you.',
      },
      {
        q: 'How do I render one video per row of data?',
        a: 'Read the row in the scene (from the environment, a file or main) and render once per row from a loop or a CI matrix. The example above renders a thank-you card per contributor.',
      },
      {
        q: 'How fast is oxframe compared to Shotstack?',
        a: 'We have not timed Shotstack: it needs an account, and a cloud render includes the queue. oxframe renders a 27.5-second explainer in 8.4 seconds on a laptop with 8 jobs.',
      },
      {
        q: 'Do I need an account or an API key?',
        a: 'No. oxframe sends nothing anywhere; the only network use is the optional playground on oxframe.dev.',
      },
    ],
    sources: [
      { label: 'Shotstack pricing', url: 'https://shotstack.io/pricing/' },
      {
        label: 'Shotstack Hello World guide',
        url: 'https://shotstack.io/docs/guide/getting-started/hello-world-using-curl/',
      },
      { label: 'Shotstack API reference', url: 'https://shotstack.io/docs/api/' },
      ...OXFRAME_SOURCES,
    ],
  },
  {
    slug: 'cloud-video-apis',
    name: 'cloud video APIs',
    title: 'oxframe vs Shotstack, Creatomate and JSON2Video',
    description:
      'oxframe vs cloud video APIs, checked October 2026: code on your machine vs JSON in the cloud, prices per minute, and when an API is still the right call.',
    lead: 'Pick oxframe when you can run a render yourself and want code instead of JSON, no per-minute bill and your data on your machine. Pick a cloud API such as Shotstack, Creatomate or JSON2Video when you want no install at all, a template editor for non-developers and rendering someone else scales.',
    rows: [
      ['How a video is described', 'Rust code', 'JSON timelines or templates, sent to an API'],
      ['Where it renders', 'Your machine or your CI', 'The vendor’s cloud'],
      ['Price', '$0; your own compute', 'Per minute of video or per credit'],
      ['Free tier', 'Everything', 'Trial credits (JSON2Video: watermark on the free plan)'],
      ['Your data', 'Stays on your machine', 'Uploaded to the vendor'],
      ['Template editor for non-developers', 'No', 'Yes'],
      ['Logic in the video', 'Any code: loops, data, charts', 'What the JSON schema offers'],
      [
        'An agent sees the frames',
        '<code>oxframe check</code> with a JSON report',
        'Render, download, look',
      ],
      ['License', 'MIT or Apache-2.0', 'Proprietary service'],
    ],
    sections: [
      {
        heading: 'What a minute costs',
        html: `<p>Prices from the vendors’ pricing pages on ${CHECKED}:</p>
<ul>
<li><a href="https://shotstack.io/pricing/">Shotstack</a>: Starter $39 a month for 250 minutes, Pro $99 for 750, Scale $199 for 2,000, Volume $499 for 10,000; pay as you go is $10 for 50 minutes.</li>
<li><a href="https://json2video.com/pricing/">JSON2Video</a>: Professional $49.95 a month for 200 minutes, Startup $99.95 for 500; the free plan adds a watermark.</li>
<li><a href="https://creatomate.com/pricing">Creatomate</a>: plans in credits, where a minute of 720p video is about 14 credits.</li>
</ul>
<p>A thousand 30-second videos a month is 500 minutes: $99 on Shotstack Pro, $99.95 on JSON2Video Startup. With oxframe it is compute time you already have. On a laptop, oxframe renders a 27.5-second explainer in 8.4 seconds on 8 jobs (the measurement on <a href="/">the home page</a>), so 500 minutes of similar video take about two and a half hours of one machine, or a few CI jobs.</p>`,
      },
      {
        heading: 'Code instead of JSON',
        html: `<p>A cloud API describes a video as JSON: clips on tracks, with text and images and their times. It is simple to send and hard to compute: a chart from data, a list that grows with its input or a layout that adapts to a long title has to be built before the JSON, in your own code. With oxframe the video is the code. A scene reads the row, lays out its text, draws the chart and checks that nothing overflows, and <code>oxframe check</code> catches the long title before anyone watches it.</p>`,
      },
      {
        heading: 'Rendering at scale, yourself',
        html: `<p>The reason teams reach for a cloud API is scale: thousands of videos without a machine to babysit. oxframe meets that with parallel rendering and CI rather than a bill. <code>oxframe render --jobs N</code> renders two-second segments in parallel and joins them without re-encoding, and because the output bytes do not depend on the number of jobs or the machine, a render is reproducible — the same scene gives the same file on a laptop and on a build runner. Rows of a batch are independent, so a CI matrix or <code>xargs -P</code> spreads them across runners. On a free GitHub runner, <a href="/use-cases/release-videos">release-video-action</a> renders a release video in under a minute and a half, the SDK build included.</p>
<p>The trade is real. Nobody hosts the files or scales the fleet for you, and there is no template editor a non-developer can open in a browser — that is what the vendors sell, and it is why the table above ends with "when nobody should install or run anything." oxframe's bet is that an agent writes and runs the render, so the install and the compute stop being the hard part.</p>`,
      },
    ],
    example: {
      heading: 'A video per row of a CSV',
      intro:
        'The job cloud APIs are bought for: the same card for every row of a spreadsheet. In oxframe the card is a scene that reads its row from the environment, and a shell loop renders one video per row.',
      files: ['cloud-csv.rs', 'cloud-csv.sh.txt'],
      outro:
        'Rows are independent, so a CI matrix or <code>xargs -P</code> renders them in parallel. Before the batch, <code>NAME=… oxframe check</code> on the longest name catches a title that does not fit its card.',
    },
    pickThem: [
      'Nobody on the team should install anything or run a render.',
      'Non-developers edit templates in a web editor.',
      'You want the vendor to scale rendering and host the files.',
    ],
    pickOxframe: [
      'You render many videos and do not want a per-minute bill.',
      'The data should not leave your machine or your CI.',
      'Videos need logic: charts from data, layout that adapts, code walkthroughs.',
      'An agent builds the template and should check its frames.',
    ],
    faq: [
      {
        q: 'Is oxframe a hosted API?',
        a: 'No. oxframe is a library and a CLI that render on your machine or in your CI. There is no service to call and nothing to pay for.',
      },
      {
        q: 'How do I render one video per row of a CSV?',
        a: 'Read the CSV in Rust and render the scene once per row, from a loop or a script around the CLI. Each render is independent, so rows run in parallel.',
      },
      {
        q: 'What does a render cost with oxframe?',
        a: 'Only your compute. On a laptop, a 27.5-second video renders in 8.4 seconds on 8 jobs; on a free GitHub runner, release-video-action renders a release video in under a minute and a half including the build.',
      },
      {
        q: 'When is a cloud API the better choice?',
        a: 'When nobody should install or run anything, when non-developers edit templates, or when you want someone else to host and scale rendering.',
      },
      {
        q: 'Does my data leave my machine with oxframe?',
        a: 'No. oxframe renders locally or in your own CI, so the text, images and data in a video never go to a third party. A cloud API, by design, receives whatever you put in the video. The one exception is the browser playground, which sends the code you type to compile.oxframe.dev to build it; rendering from the CLI sends nothing.',
      },
      {
        q: 'Can oxframe use my brand colors?',
        a: 'Yes. A theme sets colors and sizes for every node, and an accent color in oxframe.toml keeps text readable against it.',
      },
    ],
    sources: [
      { label: 'Shotstack pricing', url: 'https://shotstack.io/pricing/' },
      { label: 'Creatomate pricing', url: 'https://creatomate.com/pricing' },
      { label: 'JSON2Video pricing', url: 'https://json2video.com/pricing/' },
      ...OXFRAME_SOURCES,
    ],
  },
];

export const vsPage = (slug: string): VsPage | undefined => vsPages.find((p) => p.slug === slug);
