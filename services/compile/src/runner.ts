import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';
import type { Config } from './config';
import type { ValidationError } from './validate';

export interface BuildResult {
  ok: boolean;
  /** Failure not caused by the user's code (tooling, timeout): not cached. */
  transient?: boolean;
  errors: ValidationError[];
  log: string;
  /** Present when ok: paths to bundle.js and bundle.wasm. */
  js?: string;
  wasm?: string;
}

export interface Runner {
  /** Builds `source` and writes bundle.js / bundle.wasm into `outDir`. */
  build(source: string, outDir: string, worker: number): Promise<BuildResult>;
  /** Pre-compiles dependencies so the first user build is fast. */
  warm?(worker: number): Promise<void>;
}

// TEMPLATE_DIR: where the template lives when this service runs as a
// compiled binary (import.meta.dir is then inside the executable).
const TEMPLATE =
  process.env.TEMPLATE_DIR ?? resolve(import.meta.dir, '../../../infra/sandbox/template');

interface CargoMessage {
  reason: string;
  success?: boolean;
  message?: {
    level: string;
    message: string;
    rendered?: string;
    spans: Array<{
      file_name: string;
      line_start: number;
      column_start: number;
      is_primary: boolean;
    }>;
  };
}

/** Structured errors from cargo's JSON output; only the user's file matters. */
export function parseCargo(stdout: string): {
  errors: ValidationError[];
  log: string;
  success: boolean;
} {
  const errors: ValidationError[] = [];
  let log = '';
  let success = false;
  for (const line of stdout.split('\n')) {
    if (!line.startsWith('{')) continue;
    let m: CargoMessage;
    try {
      m = JSON.parse(line) as CargoMessage;
    } catch {
      continue;
    }
    if (m.reason === 'build-finished') success = !!m.success;
    if (m.reason !== 'compiler-message' || !m.message) continue;
    const d = m.message;
    if (d.level !== 'error' && d.level !== 'warning') continue;
    if (d.rendered) log += d.rendered;
    if (d.level !== 'error') continue;
    const span = d.spans.find((s) => s.is_primary && s.file_name.endsWith('scene.rs'));
    errors.push({
      file: 'scene.rs',
      line: span?.line_start ?? 1,
      column: span?.column_start ?? 1,
      message: d.message,
    });
  }
  return { errors, log, success };
}

async function run(
  cmd: string[],
  opts: { cwd?: string; env?: Record<string, string>; timeoutMs: number },
) {
  const proc = Bun.spawn(cmd, {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const timer = setTimeout(() => proc.kill('SIGKILL'), opts.timeoutMs);
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  clearTimeout(timer);
  return { stdout, stderr, code, killed: proc.signalCode === 'SIGKILL' };
}

function finishArtifacts(dir: string, outDir: string, maxBytes: number): BuildResult | null {
  const wasm = join(outDir, 'bundle.wasm');
  if (!existsSync(wasm)) return null;
  const size = statSync(wasm).size;
  if (size > maxBytes) {
    return {
      ok: false,
      errors: [
        {
          file: 'scene.rs',
          line: 1,
          column: 1,
          message: `the result is ${size} bytes; the limit is ${maxBytes}`,
        },
      ],
      log: '',
    };
  }
  const br = brotliCompressSync(readFileSync(wasm), {
    params: { [constants.BROTLI_PARAM_QUALITY]: 9 },
  });
  writeFileSync(join(outDir, 'bundle.wasm.br'), br);
  rmSync(join(outDir, 'bundle_bg.wasm'), { force: true });
  void dir;
  return { ok: true, errors: [], log: '', js: join(outDir, 'bundle.js'), wasm };
}

/**
 * Runs cargo directly on the host. NO ISOLATION — for development and
 * tests only; production uses `DockerRunner` (gVisor, no network).
 */
export class LocalRunner implements Runner {
  constructor(private readonly cfg: Config) {}

  /** The worker's crate, kept in sync with the template (so template
   *  changes apply without wiping the warm target directory). */
  private crateDir(worker: number): string {
    const dir = join(this.cfg.dataDir, 'work', `w${worker}`);
    mkdirSync(join(dir, 'src'), { recursive: true });
    const manifest = readFileSync(join(TEMPLATE, 'Cargo.toml.in'), 'utf8').replaceAll(
      '{{OXFRAME_DEP}}',
      this.cfg.oxframeDep,
    );
    const sync = (path: string, content: string) => {
      if (!existsSync(path) || readFileSync(path, 'utf8') !== content) writeFileSync(path, content);
    };
    sync(join(dir, 'Cargo.toml'), manifest);
    sync(join(dir, 'src/lib.rs'), readFileSync(join(TEMPLATE, 'src/lib.rs'), 'utf8'));
    if (!existsSync(join(dir, 'src/scene.rs'))) {
      copyFileSync(join(TEMPLATE, 'src/scene.rs'), join(dir, 'src/scene.rs'));
    }
    return dir;
  }

  async warm(worker: number): Promise<void> {
    const dir = this.crateDir(worker);
    const r = await run(['cargo', 'build', '--release', '--target', 'wasm32-unknown-unknown'], {
      cwd: dir,
      timeoutMs: 30 * 60_000,
    });
    // The template must build: a broken one (e.g. after an SDK API change)
    // would otherwise only show up as a failed production image build.
    if (r.killed || r.code !== 0) {
      throw new Error(
        `warming worker ${worker} failed: the sandbox template does not build\n${stripAnsi(r.stderr).slice(-3000)}`,
      );
    }
  }

  async build(source: string, outDir: string, worker: number): Promise<BuildResult> {
    const dir = this.crateDir(worker);
    writeFileSync(join(dir, 'src/scene.rs'), source);
    const t = this.cfg.timeoutMs;
    const cargo = await run(
      [
        'cargo',
        'build',
        '--release',
        '--target',
        'wasm32-unknown-unknown',
        '--message-format=json-diagnostic-rendered-ansi',
      ],
      { cwd: dir, timeoutMs: t, env: { CARGO_TERM_COLOR: 'never' } },
    );
    if (cargo.killed) return timeout(t);
    const parsed = parseCargo(cargo.stdout);
    if (!parsed.success || cargo.code !== 0) {
      if (parsed.errors.length)
        return { ok: false, errors: parsed.errors, log: stripAnsi(parsed.log) };
      return {
        ok: false,
        transient: true,
        errors: [
          {
            file: 'scene.rs',
            line: 1,
            column: 1,
            message: `internal build error:\n${stripAnsi(cargo.stderr).slice(-2000)}`,
          },
        ],
        log: '',
      };
    }
    mkdirSync(outDir, { recursive: true });
    const tools = this.cfg.toolsDir;
    const wasmIn = join(dir, 'target/wasm32-unknown-unknown/release/scene.wasm');
    const bg = await run(
      [
        join(tools, 'wasm-bindgen'),
        '--target',
        'web',
        '--out-dir',
        outDir,
        '--out-name',
        'bundle',
        '--no-typescript',
        wasmIn,
      ],
      { timeoutMs: t },
    );
    if (bg.code !== 0) return { ok: false, transient: true, errors: [], log: bg.stderr };
    const opt = await run(
      [
        join(tools, 'wasm-opt'),
        '-Os',
        '--enable-bulk-memory',
        '--enable-nontrapping-float-to-int',
        '--enable-sign-ext',
        '--enable-mutable-globals',
        join(outDir, 'bundle_bg.wasm'),
        '-o',
        join(outDir, 'bundle.wasm'),
      ],
      { timeoutMs: t },
    );
    if (opt.code !== 0) return { ok: false, transient: true, errors: [], log: opt.stderr };
    return (
      finishArtifacts(dir, outDir, this.cfg.maxArtifactBytes) ?? {
        ok: false,
        errors: [],
        log: 'no output',
      }
    );
  }
}

/**
 * Production runner: one throwaway container per build, under gVisor, with
 * no network, a read-only root, an empty environment and cgroup limits.
 * The image contains the template crate with warmed dependencies
 * (infra/sandbox/Dockerfile). Each worker reuses its own target volume.
 */
export class DockerRunner implements Runner {
  constructor(private readonly cfg: Config) {}

  dockerArgs(jobDir: string, outDir: string, worker: number): string[] {
    return [
      'docker',
      'run',
      '--rm',
      `--runtime=${this.cfg.runtime}`,
      '--network=none',
      '--read-only',
      '--tmpfs',
      '/tmp:rw,size=100m',
      '--memory=2g',
      '--memory-swap=2g',
      '--cpus=2',
      '--pids-limit=256',
      '--cap-drop=ALL',
      '--security-opt=no-new-privileges',
      '--env-file=/dev/null',
      '-v',
      `oxframe-target-w${worker}:/work/target`,
      '-v',
      `${join(jobDir, 'scene.rs')}:/work/src/scene.rs:ro`,
      '-v',
      `${outDir}:/out`,
      this.cfg.image,
      '/work/build.sh',
    ];
  }

  async build(source: string, outDir: string, worker: number): Promise<BuildResult> {
    const jobDir = join(this.cfg.dataDir, 'jobs', `w${worker}`);
    mkdirSync(jobDir, { recursive: true });
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(jobDir, 'scene.rs'), source);
    const t = this.cfg.timeoutMs;
    const r = await run(this.dockerArgs(jobDir, outDir, worker), { timeoutMs: t + 5_000 });
    if (r.killed) return timeout(t);
    const parsed = parseCargo(r.stdout);
    if (r.code !== 0) {
      if (parsed.errors.length)
        return { ok: false, errors: parsed.errors, log: stripAnsi(parsed.log) };
      const message =
        r.code === 137 ? 'the build exceeded its memory limit' : 'internal build error';
      // Memory exhaustion is caused by the code; other failures are ours.
      return {
        ok: false,
        transient: r.code !== 137,
        errors: [{ file: 'scene.rs', line: 1, column: 1, message }],
        log: stripAnsi(r.stderr.slice(-4000)),
      };
    }
    return (
      finishArtifacts(jobDir, outDir, this.cfg.maxArtifactBytes) ?? {
        ok: false,
        errors: [],
        log: r.stderr,
      }
    );
  }
}

function timeout(ms: number): BuildResult {
  return {
    ok: false,
    transient: true,
    errors: [
      {
        file: 'scene.rs',
        line: 1,
        column: 1,
        message: `the build took longer than ${ms / 1000} s`,
      },
    ],
    log: '',
  };
}

export function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');
}
