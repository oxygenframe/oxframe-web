/// <reference lib="webworker" />
// The engine inside a Web Worker: loads a scene compiled by compile-service
// (wasm-bindgen `--target web` output) and speaks the protocol through the
// wasm ABI of `oxframe-preview`:
//   init(config_json) -> Engine
//   Engine.command(json), Engine.tick(now_s)
//   Engine.poll_events() -> string[], Engine.poll_frame() -> Uint8Array | undefined
// engine-worker.ts (the editor) adds MP4 export; player-worker.ts uses it as is.
import type { FromWorker, ToWorker } from './in-page-wasm';

export interface WasmEngine {
  info(): string;
  render_frame(frame: number): Uint8Array;
  command(json: string): void;
  tick(nowSeconds: number): void;
  poll_events(): string[];
  poll_frame(): Uint8Array | undefined;
}

interface WasmModule {
  default(input?: { module_or_path: string }): Promise<unknown>;
  init(configJson: string): WasmEngine;
  /** Present when the scene was built with WebGPU support. */
  init_gpu?(configJson: string, canvas: OffscreenCanvas): Promise<WasmEngine>;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let engine: WasmEngine | null = null;
/** Set when rendering with WebGPU: frames are drawn here. */
let canvas: OffscreenCanvas | null = null;

/** MP4 export, when the worker offers it. */
export type Exporter = (
  engine: WasmEngine,
  bitrate: number,
  canvas: OffscreenCanvas | null,
  progress: (done: number, total: number) => void,
) => Promise<ArrayBuffer>;

function post(msg: FromWorker, transfer: Transferable[] = []): void {
  ctx.postMessage(msg, transfer);
}

function flush(): void {
  if (!engine) return;
  for (const json of engine.poll_events()) post({ type: 'event', json });
  for (let f = engine.poll_frame(); f; f = engine.poll_frame()) {
    // Format 4 (Surface): the frame is already in the canvas.
    if (canvas && f[8] === 4) {
      const frame = new DataView(f.buffer, f.byteOffset).getUint32(0, true);
      const bitmap = canvas.transferToImageBitmap();
      post({ type: 'bitmap', frame, bitmap }, [bitmap]);
      continue;
    }
    const copy = f.slice().buffer;
    post({ type: 'frame', buffer: copy }, [copy]);
  }
}

/** Answers the editor's messages in this worker. */
export function serveEngine(exportMp4?: Exporter): void {
  ctx.onmessage = async (m: MessageEvent<ToWorker>) => {
    const msg = m.data;
    try {
      if (msg.type === 'init') {
        const mod = (await import(/* @vite-ignore */ msg.jsUrl)) as WasmModule;
        await mod.default({ module_or_path: msg.wasmUrl });
        const config = JSON.stringify(msg.config ?? {});
        // WebGPU (vello) when available, else the CPU renderer.
        let gpuError: string | undefined;
        if (mod.init_gpu && 'gpu' in navigator && typeof OffscreenCanvas !== 'undefined') {
          try {
            const c = new OffscreenCanvas(1, 1);
            engine = await mod.init_gpu(config, c);
            canvas = c;
          } catch (e) {
            gpuError = e instanceof Error ? e.message : String(e);
          }
        } else {
          gpuError = 'WebGPU is not available in this browser';
        }
        if (!engine) engine = mod.init(config);
        post({ type: 'ready', renderer: canvas ? 'gpu' : 'cpu', gpuError });
        setInterval(() => {
          engine?.tick(performance.now() / 1000);
          flush();
        }, 4);
      } else if (msg.type === 'command' && engine) {
        engine.command(msg.json);
        flush();
      } else if (msg.type === 'export' && engine) {
        try {
          if (!exportMp4) throw new Error('this player cannot export video');
          const buffer = await exportMp4(engine, msg.bitrate, canvas, (done, total) =>
            post({ type: 'export-progress', done, total }),
          );
          post({ type: 'exported', buffer }, [buffer]);
        } catch (e) {
          post({ type: 'export-failed', message: e instanceof Error ? e.message : String(e) });
        }
      }
    } catch (e) {
      post({
        type: 'fatal',
        message: e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e),
      });
    }
  };
}
