/// <reference lib="webworker" />
// Engine worker: loads a scene compiled by compile-service (wasm-bindgen
// `--target web` output) and speaks the protocol through the wasm ABI of
// `oxframe-preview`:
//   init(config_json) -> Engine
//   Engine.command(json), Engine.tick(now_s)
//   Engine.poll_events() -> string[], Engine.poll_frame() -> Uint8Array | undefined
import {
  BufferTarget,
  EncodedPacket,
  EncodedVideoPacketSource,
  Mp4OutputFormat,
  Output,
} from 'mediabunny';
import type { FromWorker, ToWorker } from './in-page-wasm';

interface WasmEngine {
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
        const buffer = await exportMp4(engine, msg.bitrate);
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

/** Renders every frame on the CPU and encodes H.264 with WebCodecs. */
async function exportMp4(e: WasmEngine, bitrate: number): Promise<ArrayBuffer> {
  if (typeof VideoEncoder === 'undefined')
    throw new Error('this browser has no WebCodecs (VideoEncoder)');
  const { fps, size, frames } = JSON.parse(e.info()) as {
    fps: number;
    size: [number, number];
    frames: number;
  };
  const [width, height] = size;
  const config: VideoEncoderConfig = {
    codec: 'avc1.640028',
    width,
    height,
    bitrate,
    framerate: fps,
  };
  if (!(await VideoEncoder.isConfigSupported(config)).supported) {
    config.codec = 'avc1.42002a';
    if (!(await VideoEncoder.isConfigSupported(config)).supported)
      throw new Error(`H.264 ${width}×${height} encoding is not supported here`);
  }
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  });
  const video = new EncodedVideoPacketSource('avc');
  output.addVideoTrack(video, { frameRate: fps });
  await output.start();
  let failure: Error | null = null;
  const fail = (err: unknown): void => {
    failure ??= err instanceof Error ? err : new Error(String(err));
  };
  // Packets must reach the muxer in order; `add` is async, so chain them.
  let muxed = Promise.resolve();
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxed = muxed.then(() => video.add(EncodedPacket.fromEncodedChunk(chunk), meta)).catch(fail);
    },
    error: fail,
  });
  encoder.configure(config);
  const usPerFrame = 1_000_000 / fps;
  for (let f = 0; f < frames; f++) {
    if (failure) throw failure;
    const timing = { timestamp: Math.round(f * usPerFrame), duration: Math.round(usPerFrame) };
    const rgba = e.render_frame(f);
    // GPU mode draws into the canvas and returns no pixels.
    const frame =
      canvas && rgba.length === 0
        ? new VideoFrame(canvas, timing)
        : new VideoFrame(rgba, {
            format: 'RGBA',
            codedWidth: width,
            codedHeight: height,
            ...timing,
          });
    encoder.encode(frame, { keyFrame: f % (fps * 2) === 0 });
    frame.close();
    // Keep the encoder queue short so memory stays flat.
    while (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 1));
    if (f % 10 === 0 || f === frames - 1)
      post({ type: 'export-progress', done: f + 1, total: frames });
  }
  await encoder.flush();
  encoder.close();
  await muxed;
  if (failure) throw failure;
  await output.finalize();
  const buffer = output.target.buffer;
  if (!buffer) throw new Error('MP4 output is empty');
  return buffer;
}
