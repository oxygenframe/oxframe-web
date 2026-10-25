/// <reference lib="webworker" />
// The editor's engine worker: the engine (engine-host.ts) plus MP4 export.
import {
  BufferTarget,
  EncodedPacket,
  EncodedVideoPacketSource,
  Mp4OutputFormat,
  Output,
} from 'mediabunny';
import { serveEngine, type WasmEngine } from './engine-host';

serveEngine(exportMp4);

/** Renders every frame on the CPU and encodes H.264 with WebCodecs. */
async function exportMp4(
  e: WasmEngine,
  bitrate: number,
  canvas: OffscreenCanvas | null,
  progress: (done: number, total: number) => void,
): Promise<ArrayBuffer> {
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
    if (f % 10 === 0 || f === frames - 1) progress(f + 1, frames);
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
