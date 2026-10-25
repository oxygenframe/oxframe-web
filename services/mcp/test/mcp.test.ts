// The MCP server against fixed sources: the protocol, every tool, and the
// errors a client can cause.
import { describe, expect, it } from 'bun:test';
import { compileScenes, handle, PROTOCOL_VERSIONS, webSources } from '../src/index';
import { type Scenes, search, type Page, type Sources } from '../src/tools';

const PAGES: Page[] = [
  {
    url: 'https://oxframe.dev/docs/guide/groups',
    title: '6. Groups and layout',
    markdown:
      'Intro to groups.\n\n## Relative placement\n\nUse `next_to` to put a node beside another.\n',
  },
  {
    url: 'https://oxframe.dev/docs/charts',
    title: 'Animated charts and plots',
    markdown: '## Axes\n\nAxes::new() with x_range and y_range.\n',
  },
];

const REPORT = {
  duration: 1.45,
  issues: [
    {
      rule: 'out_of_frame',
      severity: 'error',
      time: [0.1, 1.45],
      source: 'src/scene.rs:5',
      hint: 'Move it 661 px to the left.',
      docs: 'https://oxframe.dev/docs/check-rules#out_of_frame',
    },
  ],
};

/** A compile service that fails on `fail!` and runs everything else. */
const scenes: Scenes = {
  build: async (source) =>
    source.includes('fail!')
      ? { ok: false, errors: [{ line: 2, column: 5, message: 'cannot find macro `fail`' }] }
      : { ok: true, id: 'a'.repeat(32) },
  run: async (_id, op, at) =>
    op === 'check'
      ? { report: REPORT, storyboard_png: 'U1RPUlk=' }
      : op === 'frame'
        ? { frame: 30, seconds: at, duration: 1.45, size: [1920, 1080], png: 'RlJBTUU=' }
        : { inspect: { frame: 30, nodes: [] } },
};

const src: Sources = {
  pages: async () => PAGES,
  example: async (name) => (name === 'release' ? 'use oxframe::prelude::*;\n' : null),
  scenes,
};

/** The parts of a JSON-RPC answer these tests read. */
interface Answer {
  result: {
    protocolVersion: string;
    capabilities: { tools?: object };
    serverInfo: { name: string };
    tools: { name: string; annotations: { readOnlyHint: boolean } }[];
    content: { type: string; text?: string; data?: string; mimeType?: string }[];
    isError: boolean;
  };
  error: { code: number };
}

async function rpc(method: string, params?: unknown, id: number | null = 1) {
  const res = await handle(
    new Request('https://mcp.oxframe.dev/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', ...(id === null ? {} : { id }), method, params }),
    }),
    src,
  );
  // A 202 has no body; the tests never read it.
  return { status: res.status, body: (res.status === 202 ? null : await res.json()) as Answer };
}

const call = async (name: string, args: unknown): Promise<Answer['result']> =>
  (await rpc('tools/call', { name, arguments: args })).body.result;

describe('protocol', () => {
  it('initializes with the version the client asks for, if supported', async () => {
    const { body } = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {} });
    expect(body.result.protocolVersion).toBe('2025-06-18');
    expect(body.result.capabilities.tools).toBeDefined();
    expect(body.result.serverInfo.name).toBe('oxframe-docs');
  });

  it('answers an unknown version with its newest', async () => {
    const { body } = await rpc('initialize', { protocolVersion: '1999-01-01' });
    expect(body.result.protocolVersion).toBe(PROTOCOL_VERSIONS[0]!);
  });

  it('accepts notifications with 202 and no body', async () => {
    expect((await rpc('notifications/initialized', undefined, null)).status).toBe(202);
  });

  it('lists tools that change nothing on the client', async () => {
    const { body } = await rpc('tools/list');
    const names = body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual([
      'docs_search',
      'get_page',
      'list_components',
      'get_example',
      'check_scene',
      'render_frame',
      'inspect_scene',
    ]);
    for (const t of body.result.tools) expect(t.annotations.readOnlyHint).toBe(true);
  });

  it('rejects unknown methods and tools, and bad JSON', async () => {
    expect((await rpc('resources/list')).body.error.code).toBe(-32601);
    expect((await rpc('tools/call', { name: 'render' })).body.error.code).toBe(-32602);
    const bad = await handle(
      new Request('https://mcp.oxframe.dev/mcp', { method: 'POST', body: '{' }),
      src,
    );
    expect(bad.status).toBe(400);
  });

  it('has no event stream and points browsers to the docs', async () => {
    const sse = await handle(
      new Request('https://mcp.oxframe.dev/mcp', { headers: { Accept: 'text/event-stream' } }),
      src,
    );
    expect(sse.status).toBe(405);
    const page = await handle(new Request('https://mcp.oxframe.dev/'), src);
    expect(await page.text()).toContain('https://mcp.oxframe.dev/mcp');
  });
});

describe('tools', () => {
  it('docs_search finds the section and its page', async () => {
    const r = await call('docs_search', { query: 'next_to' });
    expect(r.isError).toBe(false);
    expect(r.content[0]!.text).toContain('Relative placement');
    expect(r.content[0]!.text).toContain('https://oxframe.dev/docs/guide/groups');
    expect((await call('docs_search', { query: '' })).isError).toBe(true);
    expect((await call('docs_search', { query: 'zzzz' })).content[0]!.text).toContain('llms.txt');
  });

  it('ranks a heading match above a body match', () => {
    const hits = search(PAGES, 'axes');
    expect(hits.startsWith('## Animated charts and plots › Axes')).toBe(true);
  });

  it('get_page takes a path, a URL or a .md URL', async () => {
    for (const url of [
      '/docs/charts',
      'https://oxframe.dev/docs/charts',
      'https://oxframe.dev/docs/charts.md',
    ]) {
      const r = await call('get_page', { url });
      expect(r.isError).toBe(false);
      expect(r.content[0]!.text).toContain('Axes::new()');
    }
    expect((await call('get_page', { url: '/docs/nope' })).isError).toBe(true);
  });

  it('list_components lists the eight components', async () => {
    const text = (await call('list_components', {})).content[0]!.text;
    for (const c of [
      'TitleCard',
      'BulletList',
      'CodeExplainer',
      'FlowDiagram',
      'Callout',
      'LowerThird',
      'EndCard',
      'ChapterMarker',
    ])
      expect(text).toContain(c);
  });

  it('get_example returns the source and refuses odd names', async () => {
    expect((await call('get_example', { name: 'release' })).content[0]!.text).toContain('```rust');
    expect((await call('get_example', { name: 'nope' })).isError).toBe(true);
    expect((await call('get_example', { name: '../secrets' })).isError).toBe(true);
  });

  it('a failing source is a tool error, not a crash', async () => {
    const broken: Sources = {
      pages: () => Promise.reject(new Error('503')),
      example: async () => null,
    };
    const res = await handle(
      new Request('https://mcp.oxframe.dev/mcp', {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'docs_search', arguments: { query: 'x' } },
        }),
      }),
      broken,
    );
    const body = (await res.json()) as Answer;
    expect(body.result.isError).toBe(true);
  });
});

describe('web sources', () => {
  it('fetches the index once and retries after a failure', async () => {
    let calls = 0;
    let ok = false;
    const fake = (async () => {
      calls++;
      return ok ? Response.json(PAGES) : new Response('', { status: 503 });
    }) as unknown as typeof fetch;
    const s = webSources(fake);
    await expect(s.pages()).rejects.toThrow('503');
    ok = true;
    expect((await s.pages()).length).toBe(2);
    await s.pages();
    expect(calls).toBe(2);
  });
});

describe('scene tools', () => {
  it('check_scene lists the issues and shows the storyboard', async () => {
    const r = await call('check_scene', { source: 'use oxframe::prelude::*;' });
    expect(r.isError).toBe(false);
    expect(r.content[0]!.text).toContain(
      '- error out_of_frame at 0.10–1.45 s, src/scene.rs:5: Move it 661 px to the left.',
    );
    expect(r.content[1]).toEqual({ type: 'image', data: 'U1RPUlk=', mimeType: 'image/png' });
  });

  it('render_frame returns the PNG and inspect_scene the tree', async () => {
    const frame = await call('render_frame', { source: 'x', at: 0.5 });
    expect(frame.content[0]!.text).toBe('Frame 30 at 0.50 s of 1.45 s, 1920×1080.');
    expect(frame.content[1]!.data).toBe('RlJBTUU=');
    const tree = await call('inspect_scene', { source: 'x', at: 0.5 });
    expect(JSON.parse(tree.content[0]!.text!)).toEqual({ frame: 30, nodes: [] });
  });

  it('shows the panic message of a scene that panics', async () => {
    const panicking: Sources = {
      ...src,
      scenes: {
        build: async () => ({ ok: true, id: 'c'.repeat(32) }),
        run: async () => ({
          error: 'RuntimeError: unreachable',
          log: 'panicked at src/scene.rs:6:24:\nboom\n\nStack:\n\nError\n    at x',
        }),
      },
    };
    const r = await handle(
      new Request('https://mcp.oxframe.dev/mcp', {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'check_scene', arguments: { source: 'x' } },
        }),
      }),
      panicking,
    );
    const { result } = (await r.json()) as Answer;
    expect(result.content[0]!.text).toBe(
      'The scene panicked while running: panicked at src/scene.rs:6:24:\nboom',
    );
  });

  it('reports compile errors with their line, and missing arguments', async () => {
    const r = await call('check_scene', { source: 'fn f() { fail!() }' });
    expect(r.isError).toBe(true);
    expect(r.content[0]!.text).toContain('scene.rs:2:5: cannot find macro `fail`');
    expect((await call('render_frame', { source: 'x' })).isError).toBe(false);
    expect((await call('render_frame', { source: 'x', at: -1 })).isError).toBe(true);
    expect((await call('check_scene', {})).isError).toBe(true);
  });

  it('polls a long build and forwards the client address', async () => {
    const seen: string[] = [];
    let polls = 0;
    const fetcher = {
      fetch: (async (url: string, init?: RequestInit) => {
        seen.push(
          `${init?.method ?? 'GET'} ${url} ${new Headers(init?.headers).get('CF-Connecting-IP')}`,
        );
        if (url.endsWith('/api/compile'))
          return Response.json({ id: 'b'.repeat(32), status: 'building', errors: [] });
        if (url.includes('/api/compile/'))
          return Response.json({
            id: 'b'.repeat(32),
            status: ++polls < 2 ? 'building' : 'done',
            errors: [],
          });
        return Response.json({ error: 'too many requests' }, { status: 429 });
      }) as typeof fetch,
    };
    const s = compileScenes(fetcher, '203.0.113.7', async () => {});
    expect(await s.build('x')).toEqual({ ok: true, id: 'b'.repeat(32) });
    expect(seen[0]).toBe('POST https://compile.oxframe.dev/api/compile 203.0.113.7');
    expect(polls).toBe(2);
    expect((await s.run('b'.repeat(32), 'check', 0)).error).toBe('too many requests');
  });
});
