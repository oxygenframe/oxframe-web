// The tools of mcp.oxframe.dev. The docs tools read; check_scene,
// render_frame and inspect_scene build one scene file with
// compile.oxframe.dev and run it there as wasm, in the build machine's
// sandbox. A whole project on disk stays with the local `oxframe mcp`.

export interface Page {
  url: string;
  title: string;
  markdown: string;
}

export interface Sources {
  /** The docs pages, from https://oxframe.dev/docs-index.json. */
  pages(): Promise<Page[]>;
  /** The source of an SDK example, or null when there is none. */
  example(name: string): Promise<string | null>;
  /** compile.oxframe.dev, absent where there is none (tests of the docs tools). */
  scenes?: Scenes;
}

/** One error from the compiler, in the user's scene. */
export interface BuildError {
  line: number;
  column: number;
  message: string;
}

export type Built =
  { ok: true; id: string } | { ok: false; errors: BuildError[]; log?: string; message?: string };

/** compile.oxframe.dev: build a scene file, then run the build. */
export interface Scenes {
  build(source: string): Promise<Built>;
  /** The JSON of POST /api/run: an `error`, or the answer for `op`. */
  run(id: string, op: 'check' | 'frame' | 'inspect', at: number): Promise<Record<string, unknown>>;
}

export interface ToolResult {
  text: string;
  /** PNGs, base64, shown after the text. */
  images?: string[];
  isError?: boolean;
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
// Builds and runs on oxframe's servers; nothing on the client changes, and
// the same source gives the same answer.
const RUNS = { ...READ_ONLY, idempotentHint: true, openWorldHint: true };

const SOURCE = {
  type: 'string',
  description:
    'The whole scene file, as in the playground at https://oxframe.dev/playground: `use oxframe::prelude::*;`, the scenes, and `pub fn project() -> Project` instead of `fn main()`. Only the oxframe crate is available (features icons and 3d; no video files or formulas).',
} as const;

export const TOOLS = [
  {
    name: 'docs_search',
    title: 'Search the oxframe docs',
    description:
      'Search the current oxframe documentation (guide lessons, node reference, effects, charts, 3D, check rules, CLI, migration guides). Returns the best-matching sections with their page URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to look for, e.g. "next_to layout".' },
      },
      required: ['query'],
    },
    annotations: READ_ONLY,
  },
  {
    name: 'get_page',
    title: 'Read an oxframe docs page',
    description:
      'The whole text of one oxframe docs page as Markdown, by URL or path (e.g. "/docs/charts" or "https://oxframe.dev/docs/guide/signals").',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'A page URL or path from docs_search.' } },
      required: ['url'],
    },
    annotations: READ_ONLY,
  },
  {
    name: 'list_components',
    title: 'List oxframe components',
    description:
      'The explainer components (TitleCard, BulletList, CodeExplainer, FlowDiagram, Callout, LowerThird, EndCard, ChapterMarker) and a one-line example of each.',
    inputSchema: { type: 'object', properties: {} },
    annotations: READ_ONLY,
  },
  {
    name: 'get_example',
    title: 'Read an oxframe example',
    description:
      'The Rust source of an example from oxframe-sdk/examples, e.g. "release", "charts", "quicksort", "code_steps", "cube_3d". The gallery at https://oxframe.dev/gallery lists them with their videos.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Example name, lowercase with underscores.' },
      },
      required: ['name'],
    },
    annotations: { ...READ_ONLY, openWorldHint: true },
  },
  {
    name: 'check_scene',
    title: 'Check an oxframe scene',
    description:
      'Builds a scene file and runs `oxframe check` on it, without a local install: compiler errors with their line, or the visual lint report (text outside the frame, overlaps, low contrast, too fast to read; each with the source line, a hint and often a fix) and a storyboard image of the whole video. Run it after every change and fix what it reports. The first build of a scene takes about 15 to 60 seconds.',
    inputSchema: {
      type: 'object',
      properties: { source: SOURCE },
      required: ['source'],
    },
    annotations: RUNS,
  },
  {
    name: 'render_frame',
    title: 'Render one frame of an oxframe scene',
    description:
      'Builds a scene file and renders the frame at `at` seconds as a full-size PNG, to look at one moment closely. check_scene gives the whole video as a storyboard.',
    inputSchema: {
      type: 'object',
      properties: {
        source: SOURCE,
        at: { type: 'number', description: 'Time in seconds from the start of the video.' },
      },
      required: ['source', 'at'],
    },
    annotations: RUNS,
  },
  {
    name: 'inspect_scene',
    title: 'Inspect the scene tree at a time',
    description:
      'Builds a scene file and returns the scene tree at `at` seconds as JSON, as `oxframe inspect --at` prints it: every node with its kind, name, bounds, opacity, text and source line.',
    inputSchema: {
      type: 'object',
      properties: {
        source: SOURCE,
        at: { type: 'number', description: 'Time in seconds from the start of the video.' },
      },
      required: ['source', 'at'],
    },
    annotations: RUNS,
  },
] as const;

// Kept in step with `list_components` in oxframe-cli (src/mcp.rs).
export const COMPONENTS = `Explainer components, all in the prelude. Add them like any node. They start invisible and take their colors from the theme.

- TitleCard::new("The half").subtitle("A worked example") — opening card. next() reveals the subtitle.
- ChapterMarker::new("2  The search") — chapter tab on the top safe edge.
- BulletList::new(["First", "Second"]) — rows stay hidden; each next() reveals one.
- CodeExplainer::new("fn main() {}").step(1, 1, "the whole program") — a code card. next() moves to the following step (lines first..=last and a caption).
- FlowDiagram::new().edge("Parse", "Run").edge("Run", "Print") — boxes in layers from the edges. .down() stacks the layers.
- Callout::new(node).text("Watch the gap") — a label with a line to a node.
- LowerThird::new("Ada").role("walks the half") — name plate on the bottom safe edge.
- EndCard::new("That's the search").note("Repeat from the top") — closing card.

Each has enter(), next() and exit(), with no arguments: card.enter().await, then card.next().await per beat, then card.exit().await.

Docs: https://oxframe.dev/docs/guide/components`;

interface Section {
  page: Page;
  heading: string;
  text: string;
}

/** A page cut at its `##`/`###` headings, so a hit is a section, not a page. */
function sections(page: Page): Section[] {
  const out: Section[] = [];
  let heading = page.title;
  let lines: string[] = [];
  const flush = () => {
    const text = lines.join('\n').trim();
    if (text) out.push({ page, heading, text });
    lines = [];
  };
  for (const line of page.markdown.split('\n')) {
    const h = /^#{1,3}\s+(.*)$/.exec(line);
    if (h) {
      flush();
      heading = h[1]!.trim();
    } else lines.push(line);
  }
  flush();
  return out;
}

export function search(pages: Page[], query: string, limit = 5): string {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (!terms.length) return '';
  const scored = pages
    .flatMap(sections)
    .map((s) => {
      const body = s.text.toLowerCase();
      const head = `${s.page.title} ${s.heading}`.toLowerCase();
      // Each term counts by how often the section uses it (up to 5), plus 3 in
      // the title or heading. Sections that use more of the terms win.
      const score = terms.reduce((n, t) => {
        const uses = Math.min(5, body.split(t).length - 1);
        return n + uses + (head.includes(t) ? 3 : 0);
      }, 0);
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.s.page.url.localeCompare(b.s.page.url))
    .slice(0, limit);
  return scored
    .map(({ s }) => {
      const text = s.text.length > 1500 ? `${s.text.slice(0, 1500)}…` : s.text;
      return `## ${s.page.title} › ${s.heading}\n${s.page.url}\n\n${text}`;
    })
    .join('\n\n');
}

const path = (url: string) =>
  url
    .trim()
    .replace(/^https?:\/\/(www\.)?oxframe\.dev/, '')
    .replace(/\.md$/, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '') || '/';

export async function callTool(
  name: string,
  args: Record<string, unknown>,
  src: Sources,
): Promise<ToolResult> {
  const str = (k: string) => (typeof args[k] === 'string' ? (args[k] as string).trim() : '');
  switch (name) {
    case 'docs_search': {
      const query = str('query');
      if (!query) return { text: 'docs_search needs a `query`.', isError: true };
      const hits = search(await src.pages(), query);
      return {
        text:
          hits ||
          `No section of the oxframe docs matches ${JSON.stringify(query)}. All pages are listed at https://oxframe.dev/llms.txt.`,
      };
    }
    case 'get_page': {
      const want = path(str('url'));
      const page = (await src.pages()).find((p) => path(p.url) === want);
      if (!page)
        return {
          text: `No docs page at ${JSON.stringify(str('url'))}. docs_search gives page URLs; https://oxframe.dev/llms.txt lists them all.`,
          isError: true,
        };
      // The Markdown starts with the page's own heading; the URL goes under it.
      const [first, ...rest] = page.markdown.split('\n');
      return {
        text: first?.startsWith('# ')
          ? `${first}\n${page.url}\n${rest.join('\n')}`
          : `# ${page.title}\n${page.url}\n\n${page.markdown}`,
      };
    }
    case 'list_components':
      return { text: COMPONENTS };
    case 'get_example': {
      const example = str('name');
      if (!/^[a-z0-9_]{1,64}$/.test(example))
        return { text: 'get_example needs a `name` such as "release" or "charts".', isError: true };
      const source = await src.example(example);
      if (source === null)
        return {
          text: `There is no example ${JSON.stringify(example)}. The gallery lists them: https://oxframe.dev/gallery`,
          isError: true,
        };
      return {
        text: `https://github.com/oxygenframe/oxframe-sdk/blob/main/examples/src/${example}.rs\n\n\`\`\`rust\n${source}\`\`\``,
      };
    }
    case 'check_scene':
    case 'render_frame':
    case 'inspect_scene': {
      const source = typeof args.source === 'string' ? args.source : '';
      if (!source.trim())
        return { text: `${name} needs the scene file as \`source\`.`, isError: true };
      const at = Number(args.at ?? 0);
      if (name !== 'check_scene' && (!Number.isFinite(at) || at < 0))
        return { text: `${name} needs \`at\`, seconds from the start (0 or more).`, isError: true };
      if (!src.scenes) return { text: 'Building scenes is not available here.', isError: true };
      const built = await src.scenes.build(source);
      if (!built.ok) return { text: buildFailure(built), isError: true };
      const op = name === 'check_scene' ? 'check' : name === 'render_frame' ? 'frame' : 'inspect';
      const out = await src.scenes.run(built.id, op, at);
      if (typeof out.error === 'string') {
        // A panic: the message is in the log, before the JS stack.
        const log = typeof out.log === 'string' ? out.log : '';
        const panic = /panicked at [^]*?(?=\n\s*Stack:|$)/.exec(log);
        return {
          text: panic
            ? `The scene panicked while running: ${panic[0].trim()}`
            : `The scene built but failed while running: ${out.error}${log ? `\n\n${log}` : ''}`,
          isError: true,
        };
      }
      if (op === 'check') return checkResult(out);
      if (op === 'frame')
        return {
          text: `Frame ${out.frame} at ${Number(out.seconds).toFixed(2)} s of ${Number(out.duration).toFixed(2)} s, ${(out.size as number[]).join('×')}.`,
          images: [String(out.png)],
        };
      return { text: JSON.stringify(out.inspect, null, 1) };
    }
    default:
      return { text: `Unknown tool ${JSON.stringify(name)}.`, isError: true };
  }
}

function buildFailure(b: Extract<Built, { ok: false }>): string {
  if (b.message) return b.message;
  const lines = b.errors.map((e) => `scene.rs:${e.line}:${e.column}: ${e.message}`);
  const log = b.log ? `\n\n${b.log.slice(-3000)}` : '';
  return `The scene does not compile:\n${lines.join('\n')}${log}`;
}

interface Issue {
  rule: string;
  severity: string;
  time: [number, number];
  source?: string;
  node?: string;
  hint: string;
  docs?: string;
}

/** The report, an issue per line first, then the JSON, then the storyboard. */
function checkResult(out: Record<string, unknown>): ToolResult {
  const report = out.report as { duration: number; issues: Issue[] };
  const errors = report.issues.filter((i) => i.severity === 'error').length;
  const head = report.issues.length
    ? `${report.issues.length} issue(s), ${errors} error(s), in ${report.duration.toFixed(2)} s of video:`
    : `No issues in ${report.duration.toFixed(2)} s of video. Look at the storyboard to judge the result.`;
  const lines = report.issues.map(
    (i) =>
      `- ${i.severity} ${i.rule} at ${i.time[0].toFixed(2)}–${i.time[1].toFixed(2)} s, ${i.source ?? i.node ?? ''}: ${i.hint}${i.docs ? ` (${i.docs})` : ''}`,
  );
  return {
    text: [head, ...lines, '', 'report.json:', JSON.stringify(report)].join('\n'),
    images: [String(out.storyboard_png)],
  };
}
