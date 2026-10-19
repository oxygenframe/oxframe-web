import type { Command, Event } from '@oxframe/protocol';
import { decodeFrame } from './frames';
import type { Backend, BackendHandlers } from './types';

/** Messages between the editor and the engine worker. */
export type ToWorker =
  | { type: 'init'; wasmUrl: string; jsUrl: string; config: unknown }
  | { type: 'command'; json: string }
  | { type: 'export'; bitrate: number };
export type FromWorker =
  | { type: 'ready'; renderer: 'gpu' | 'cpu'; gpuError?: string }
  | { type: 'bitmap'; frame: number; bitmap: ImageBitmap }
  | { type: 'event'; json: string }
  | { type: 'frame'; buffer: ArrayBuffer }
  | { type: 'export-progress'; done: number; total: number }
  | { type: 'exported'; buffer: ArrayBuffer }
  | { type: 'export-failed'; message: string }
  | { type: 'fatal'; message: string };

export interface InPageWasmOptions {
  wasmUrl: string;
  jsUrl: string;
  /** Creates the engine worker (see `engine-worker.ts`). */
  createWorker: () => Worker;
  /** Project config passed to `init` (size, fps…); optional. */
  config?: unknown;
  /** A Seek with no answer within this time restarts the worker. */
  watchdogMs?: number;
}

/**
 * Runs a scene compiled to wasm inside a Web Worker, so a hanging scene
 * never blocks the page. A watchdog terminates the worker if a `Seek` gets
 * no answer within 5 s, and reports an error instead of freezing.
 */
export class InPageWasm implements Backend {
  readonly kind = 'wasm' as const;
  private worker: Worker | null = null;
  private handlers: BackendHandlers | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private chain: Promise<void> = Promise.resolve();
  private pending: Command[] = [];
  private ready = false;
  /** Which renderer the engine uses (known after the worker is ready). */
  renderer: 'gpu' | 'cpu' | null = null;
  /** Why WebGPU was not used, if it was not. */
  gpuError: string | null = null;

  constructor(private readonly opts: InPageWasmOptions) {}

  connect(h: BackendHandlers): void {
    this.handlers = h;
    this.start();
  }

  private start(): void {
    const h = this.handlers;
    if (!h) return;
    h.status({ state: 'connecting' });
    this.ready = false;
    const w = this.opts.createWorker();
    this.worker = w;
    w.onmessage = (m: MessageEvent<FromWorker>) => this.onMessage(m.data);
    w.onerror = (e) => this.fail(`engine worker error: ${e.message}`);
    w.postMessage({
      type: 'init',
      wasmUrl: this.opts.wasmUrl,
      jsUrl: this.opts.jsUrl,
      // Plain data only: reactive proxies cannot cross postMessage.
      config: JSON.parse(JSON.stringify(this.opts.config ?? null)) as unknown,
    } satisfies ToWorker);
  }

  private onMessage(msg: FromWorker): void {
    const h = this.handlers;
    if (!h) return;
    switch (msg.type) {
      case 'ready':
        this.ready = true;
        this.renderer = msg.renderer;
        this.gpuError = msg.gpuError ?? null;
        if (msg.renderer === 'cpu' && msg.gpuError)
          console.info(`oxframe: using the CPU renderer (${msg.gpuError})`);
        h.status({ state: 'open' });
        for (const c of this.pending.splice(0)) this.send(c);
        break;
      case 'event':
        this.chain = this.chain.then(() => h.event(JSON.parse(msg.json) as Event));
        break;
      case 'frame':
        this.clearWatchdog();
        this.chain = this.chain.then(async () => {
          const f = await decodeFrame(msg.buffer);
          if (f) h.frame(f);
        });
        break;
      case 'fatal':
        this.fail(msg.message);
        break;
      case 'bitmap': {
        this.clearWatchdog();
        const header = {
          frame: msg.frame,
          width: msg.bitmap.width,
          height: msg.bitmap.height,
          format: 4 as const,
          len: 0,
        };
        this.chain = this.chain.then(() => h.frame({ header, image: msg.bitmap }));
        break;
      }
      case 'export-progress':
        this.exporting?.progress(msg.done, msg.total);
        break;
      case 'exported':
        this.exporting?.resolve(new Blob([msg.buffer], { type: 'video/mp4' }));
        this.exporting = null;
        break;
      case 'export-failed':
        this.exporting?.reject(new Error(msg.message));
        this.exporting = null;
        break;
    }
  }

  private exporting: {
    resolve: (b: Blob) => void;
    reject: (e: Error) => void;
    progress: (done: number, total: number) => void;
  } | null = null;

  /**
   * Renders the whole project in the worker and encodes it with WebCodecs
   * (H.264 in MP4). No server involved.
   */
  exportMp4(
    onProgress: (done: number, total: number) => void = () => {},
    bitrate = 8_000_000,
  ): Promise<Blob> {
    if (!this.worker || !this.ready) return Promise.reject(new Error('engine not ready'));
    if (this.exporting) return Promise.reject(new Error('an export is already running'));
    return new Promise((resolve, reject) => {
      this.exporting = { resolve, reject, progress: onProgress };
      this.worker!.postMessage({ type: 'export', bitrate } satisfies ToWorker);
    });
  }

  private fail(message: string): void {
    this.clearWatchdog();
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.handlers?.event({ type: 'Error', kind: 'Runtime', message, spans: [] });
    this.handlers?.status({ state: 'closed', reason: message });
  }

  private clearWatchdog(): void {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
  }

  send(cmd: Command): void {
    if (!this.worker || !this.ready) {
      if (this.worker) this.pending.push(cmd);
      return;
    }
    if (cmd.type === 'Seek' || cmd.type === 'Play' || cmd.type === 'Step') {
      this.clearWatchdog();
      this.watchdog = setTimeout(
        () =>
          this.fail('the scene did not answer within 5 s (infinite loop?); the engine was stopped'),
        this.opts.watchdogMs ?? 5000,
      );
    }
    this.worker.postMessage({ type: 'command', json: JSON.stringify(cmd) } satisfies ToWorker);
  }

  /** Restarts the worker (e.g. with new wasm after a recompile). */
  reload(wasmUrl: string, jsUrl: string, config?: unknown): void {
    this.clearWatchdog();
    this.worker?.terminate();
    this.opts.wasmUrl = wasmUrl;
    this.opts.jsUrl = jsUrl;
    if (config !== undefined) this.opts.config = config;
    this.start();
  }

  close(): void {
    this.clearWatchdog();
    this.worker?.terminate();
    this.worker = null;
    this.handlers?.status({ state: 'closed', reason: 'closed by editor' });
  }
}
