import type { Command, Event } from '@oxframe/protocol';
import { decodeFrame } from './frames';
import type { Backend, BackendHandlers } from './types';

export interface LocalWsOptions {
  /** Absolute ws(s):// URL or a path relative to the page (`/ws`). */
  url: string;
  token?: string;
  /** Reconnect backoff bounds. */
  minDelayMs?: number;
  maxDelayMs?: number;
  /** For tests. */
  WebSocketImpl?: typeof WebSocket;
}

export function resolveWsUrl(url: string, token: string | undefined, base: string): string {
  const u = new URL(url, base);
  if (u.protocol === 'http:') u.protocol = 'ws:';
  if (u.protocol === 'https:') u.protocol = 'wss:';
  if (token) u.searchParams.set('token', token);
  return u.toString();
}

/** Exponential backoff with an upper bound. */
export function backoff(attempt: number, min: number, max: number): number {
  return Math.min(max, min * 2 ** Math.max(0, attempt - 1));
}

/**
 * WebSocket to `oxframe dev`. Reconnects with exponential backoff, so the
 * editor survives CLI restarts. Frames are decoded in order: a slow decode
 * never shows an older frame after a newer one.
 */
export class LocalWs implements Backend {
  readonly kind = 'ws' as const;
  private ws: WebSocket | null = null;
  private handlers: BackendHandlers | null = null;
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private latestFrame = -1;
  private decodeChain: Promise<void> = Promise.resolve();
  private readonly url: string;
  private readonly min: number;
  private readonly max: number;
  private readonly WS: typeof WebSocket;

  constructor(opts: LocalWsOptions) {
    const base = typeof location !== 'undefined' ? location.href : 'http://127.0.0.1/';
    this.url = resolveWsUrl(opts.url, opts.token, base);
    this.min = opts.minDelayMs ?? 250;
    this.max = opts.maxDelayMs ?? 5000;
    this.WS = opts.WebSocketImpl ?? WebSocket;
  }

  connect(h: BackendHandlers): void {
    this.handlers = h;
    this.closed = false;
    this.open();
  }

  private open(): void {
    const h = this.handlers;
    if (!h || this.closed) return;
    h.status(
      this.attempt === 0
        ? { state: 'connecting' }
        : { state: 'reconnecting', attempt: this.attempt, delayMs: 0 },
    );
    const ws = new this.WS(this.url);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => {
      this.attempt = 0;
      h.status({ state: 'open' });
    };
    ws.onmessage = (m: MessageEvent) => {
      if (typeof m.data === 'string') {
        let e: Event;
        try {
          e = JSON.parse(m.data) as Event;
        } catch {
          return;
        }
        // Keep events ordered after frames still being decoded.
        this.decodeChain = this.decodeChain.then(() => h.event(e));
        return;
      }
      const buf = m.data as ArrayBuffer;
      this.decodeChain = this.decodeChain.then(async () => {
        const f = await decodeFrame(buf);
        if (f) {
          this.latestFrame = f.header.frame;
          h.frame(f);
        }
      });
    };
    ws.onclose = () => {
      this.ws = null;
      if (this.closed) return;
      this.attempt += 1;
      const delayMs = backoff(this.attempt, this.min, this.max);
      h.status({ state: 'reconnecting', attempt: this.attempt, delayMs });
      this.timer = setTimeout(() => this.open(), delayMs);
    };
    ws.onerror = () => ws.close();
  }

  send(cmd: Command): void {
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(cmd));
  }

  close(): void {
    this.closed = true;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
    this.handlers?.status({ state: 'closed', reason: 'closed by editor' });
  }

  /** Index of the last frame delivered (for tests and diagnostics). */
  get lastFrame(): number {
    return this.latestFrame;
  }
}
