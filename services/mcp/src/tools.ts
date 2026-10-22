// The tools of mcp.oxframe.dev. All of them read; none runs code. Building,
// checking and rendering a scene stay in the local `oxframe mcp`, which has
// the project on disk.

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
}

export interface ToolResult {
  text: string;
  isError?: boolean;
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

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
      return { text: `# ${page.title}\n${page.url}\n\n${page.markdown}` };
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
    default:
      return { text: `Unknown tool ${JSON.stringify(name)}.`, isError: true };
  }
}
