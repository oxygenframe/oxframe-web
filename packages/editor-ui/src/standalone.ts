// Standalone editor served by `oxframe dev`. Configuration comes from
// `window.__OXFRAME_CONFIG__` (injected by the CLI) and the page URL:
// `?token=…` authenticates the WebSocket, `?backend=mock` runs a fake
// engine (tests, demos).
import { mount } from 'svelte';
import { LocalWs, MockBackend, type Backend } from '@oxframe/backends';
import { Editor, EditorState } from './lib';

interface OxframeConfig {
  backend?: 'ws' | 'wasm' | 'mock';
  url?: string;
}

declare global {
  interface Window {
    __OXFRAME_CONFIG__?: OxframeConfig;
    __oxframe?: { editor: EditorState; backend: Backend };
  }
}

const params = new URLSearchParams(location.search);
const cfg: OxframeConfig = window.__OXFRAME_CONFIG__ ?? {};
const kind = (params.get('backend') as OxframeConfig['backend']) ?? cfg.backend ?? 'ws';

const backend: Backend =
  kind === 'mock'
    ? new MockBackend()
    : new LocalWs({ url: cfg.url ?? '/ws', token: params.get('token') ?? undefined });

const editor = new EditorState(backend, { uiVersion: __EDITOR_VERSION__ });
// Exposed for debugging and end-to-end tests.
window.__oxframe = { editor, backend };

mount(Editor, { target: document.getElementById('app')!, props: { editor } });
