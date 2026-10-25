// Runs one compiled scene (bundle.js + bundle.wasm from a build) and prints
// one JSON object: `check` gives the report and the storyboard PNG,
// `frame` one frame as PNG, `inspect` the scene tree at a time.
//
//   bun scene-run.ts <dir with bundle.js and bundle.wasm> <check|frame|inspect> [seconds]
//
// The scene is wasm, so it cannot reach files or the network; app.ts runs
// this in its own process with a time limit, because a scene can loop.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type RunOp = 'check' | 'frame' | 'inspect';

interface Bundle {
  default(opts: { module_or_path: BufferSource }): Promise<unknown>;
  check(config: string): { report: string; storyboard: Uint8Array };
  inspect(config: string, seconds: number): string;
  init(config: string): {
    info(): string;
    render_png(frame: number): Uint8Array;
  };
}

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

export async function runScene(dir: string, op: RunOp, seconds: number): Promise<unknown> {
  const mod = (await import(join(dir, 'bundle.js'))) as Bundle;
  await mod.default({ module_or_path: readFileSync(join(dir, 'bundle.wasm')) });
  switch (op) {
    case 'check': {
      const out = mod.check('');
      return { report: JSON.parse(out.report), storyboard_png: b64(out.storyboard) };
    }
    case 'inspect':
      return { inspect: JSON.parse(mod.inspect('', seconds)) };
    case 'frame': {
      const engine = mod.init('');
      const info = JSON.parse(engine.info()) as { fps: number; frames: number; size: number[] };
      const frame = Math.max(0, Math.min(info.frames - 1, Math.round(seconds * info.fps)));
      return {
        frame,
        seconds: frame / info.fps,
        size: info.size,
        duration: info.frames / info.fps,
        png: b64(engine.render_png(frame)),
      };
    }
  }
}

if (import.meta.main) {
  const [dir, op, at] = process.argv.slice(2);
  if (!dir || (op !== 'check' && op !== 'frame' && op !== 'inspect')) {
    console.error('usage: scene-run.ts <dir> <check|frame|inspect> [seconds]');
    process.exit(2);
  }
  try {
    process.stdout.write(JSON.stringify(await runScene(dir, op, Number(at ?? 0) || 0)));
  } catch (e) {
    // A panic in the scene arrives as a RuntimeError ("unreachable"); the
    // panic message itself went to stderr through console.error.
    process.stdout.write(JSON.stringify({ error: String(e) }));
    process.exit(1);
  }
}
