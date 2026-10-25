// mcp.oxframe.dev: MCP over Streamable HTTP, stateless. Every POST carries
// one JSON-RPC message and gets a JSON answer; there are no sessions and no
// server-sent events. The scene tools wait for compile.oxframe.dev, reached
// through a service binding.
import { type Built, callTool, type Page, type Scenes, type Sources, TOOLS } from './tools';

export const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
const SERVER = { name: 'oxframe-docs', title: 'oxframe', version: '0.2.0' };
const INSTRUCTIONS =
  'oxframe is a Rust library for motion graphics and videos from code. Search the docs before writing a scene; get_page reads a whole page. check_scene builds one scene file and reports what is wrong in its frames, with a storyboard; render_frame shows one moment. Write the scene as the playground does (`pub fn project() -> Project`). To render the video file and work on a project on disk, use the local `oxframe mcp` from the oxframe CLI (cargo install oxframe-cli).';

const INDEX_URL = 'https://oxframe.dev/docs-index.json';
const EXAMPLE_URL = (name: string) =>
  `https://raw.githubusercontent.com/oxygenframe/oxframe-sdk/main/examples/src/${name}.rs`;

/** Sources over the network, cached in the isolate for ten minutes. */
export function webSources(fetcher: typeof fetch = fetch): Sources {
  let cached: { at: number; pages: Promise<Page[]> } | null = null;
  return {
    pages() {
      if (!cached || Date.now() - cached.at > 600_000) {
        const pages = fetcher(INDEX_URL).then(async (r) => {
          if (!r.ok) throw new Error(`${INDEX_URL}: ${r.status}`);
          return (await r.json()) as Page[];
        });
        // A failed fetch is not kept: the next call tries again.
        pages.catch(() => (cached = null));
        cached = { at: Date.now(), pages };
      }
      return cached.pages;
    },
    async example(name) {
      const r = await fetcher(EXAMPLE_URL(name));
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`example ${name}: ${r.status}`);
      return r.text();
    },
  };
}

/** The compile service's answers, as far as these tools read them. */
interface Compiled {
  id: string;
  status: 'queued' | 'building' | 'done' | 'error';
  errors: { line: number; column: number; message: string }[];
  log?: string;
  error?: string;
}

/**
 * compile.oxframe.dev through `fetcher` (a service binding). `ip` is the
 * MCP client's address, so the compile service's rate limit counts each
 * client, not this Worker.
 */
export function compileScenes(
  fetcher: { fetch: typeof fetch },
  ip: string,
  sleep = (ms: number) => new Promise((ok) => setTimeout(ok, ms)),
): Scenes {
  const base = 'https://compile.oxframe.dev';
  const headers = { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip };
  return {
    async build(source): Promise<Built> {
      const r = await fetcher.fetch(`${base}/api/compile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ source }),
      });
      let c = (await r.json()) as Compiled;
      if (!r.ok)
        return { ok: false, errors: [], message: c.error ?? `compile service: ${r.status}` };
      // A long build answers before it ends; poll it for up to two minutes.
      for (let i = 0; (c.status === 'queued' || c.status === 'building') && i < 40; i++) {
        await sleep(3000);
        c = (await (
          await fetcher.fetch(`${base}/api/compile/${c.id}`, { headers })
        ).json()) as Compiled;
      }
      if (c.status === 'done') return { ok: true, id: c.id };
      if (c.status === 'error') return { ok: false, errors: c.errors, log: c.log };
      return {
        ok: false,
        errors: [],
        message: 'The build did not finish in two minutes. Try again.',
      };
    },
    async run(id, op, at) {
      const r = await fetcher.fetch(`${base}/api/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id, op, at }),
      });
      const body = (await r.json()) as Record<string, unknown>;
      if (!r.ok && !body.error) body.error = `compile service: ${r.status}`;
      return body;
    },
  };
}

type Message = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

const reply = (id: Message['id'], result: unknown) => json({ jsonrpc: '2.0', id, result });
const fail = (id: Message['id'], code: number, message: string, status = 200) =>
  json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, status);

export async function handle(req: Request, src: Sources): Promise<Response> {
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (url.pathname !== '/' && url.pathname !== '/mcp')
    return new Response('Not found', { status: 404 });
  if (req.method === 'GET') {
    // A browser gets a pointer; an MCP client asking for an event stream is
    // told there is none (allowed by the spec for servers without SSE).
    if (req.headers.get('accept')?.includes('text/event-stream'))
      return new Response(null, { status: 405, headers: { Allow: 'POST', ...CORS } });
    return new Response(
      `oxframe docs over MCP (Streamable HTTP). Add https://mcp.oxframe.dev/mcp to your MCP client.\nTools: ${TOOLS.map((t) => t.name).join(', ')}.\nhttps://oxframe.dev/agents\n`,
      { headers: { 'Content-Type': 'text/plain; charset=utf-8', ...CORS } },
    );
  }
  if (req.method !== 'POST')
    return new Response(null, { status: 405, headers: { Allow: 'POST', ...CORS } });

  let msg: Message;
  try {
    msg = (await req.json()) as Message;
  } catch {
    return fail(null, -32700, 'Parse error', 400);
  }
  if (Array.isArray(msg) || typeof msg !== 'object' || msg === null || msg.jsonrpc !== '2.0')
    return fail(null, -32600, 'Invalid Request: one JSON-RPC 2.0 message per POST', 400);
  // Notifications (no id) and responses get 202 and no body.
  if (msg.id === undefined || !msg.method)
    return new Response(null, { status: 202, headers: CORS });

  const params = msg.params ?? {};
  switch (msg.method) {
    case 'initialize': {
      const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
      return reply(msg.id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER,
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return reply(msg.id, {});
    case 'tools/list':
      return reply(msg.id, { tools: TOOLS });
    case 'tools/call': {
      const name = typeof params.name === 'string' ? params.name : '';
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      if (!TOOLS.some((t) => t.name === name)) return fail(msg.id, -32602, `Unknown tool: ${name}`);
      try {
        const r = await callTool(name, args, src);
        return reply(msg.id, {
          content: [
            { type: 'text', text: r.text },
            ...(r.images ?? []).map((data) => ({ type: 'image', data, mimeType: 'image/png' })),
          ],
          isError: r.isError ?? false,
        });
      } catch (e) {
        return reply(msg.id, {
          content: [
            {
              type: 'text',
              text: `oxframe.dev did not answer: ${(e as Error).message}. Try again.`,
            },
          ],
          isError: true,
        });
      }
    }
    default:
      return fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

const sources = webSources();

interface Env {
  /** Service binding to the oxframe-compile Worker. */
  COMPILE: { fetch: typeof fetch };
}

export default {
  fetch: (req: Request, env: Env) =>
    handle(req, {
      ...sources,
      scenes: compileScenes(env.COMPILE, req.headers.get('CF-Connecting-IP') ?? 'unknown'),
    }),
};
