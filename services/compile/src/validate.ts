// Cheap textual checks before spending a build. The sandbox is the real
// security boundary; these reject what can never work or would make the
// generated JS glue depend on user input.

export interface ValidationError {
  file: string;
  line: number;
  column: number;
  message: string;
}

const FORBIDDEN: Array<[RegExp, string]> = [
  [/#!\s*\[\s*no_std\s*\]/, '`#![no_std]` is not supported in the playground'],
  [/#!\s*\[\s*feature\s*\(/, 'nightly `#![feature]` attributes are not available'],
  [/\b(?:global_)?asm!\s*[({[]/, 'inline assembly is not allowed'],
  [/\bwasm_bindgen\b/, '`wasm_bindgen` is managed by the playground; remove it from your scene'],
  [
    /#\s*\[\s*(?:unsafe\s*\(\s*)?(?:no_mangle|export_name|link_section|link)\b/,
    'linkage attributes are not allowed',
  ],
  [/\bextern\s+crate\b/, '`extern crate` is not allowed; only the oxframe SDK is available'],
];

export function validateSource(source: string, maxBytes: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const bytes = new TextEncoder().encode(source).byteLength;
  if (bytes > maxBytes) {
    return [
      {
        file: 'scene.rs',
        line: 1,
        column: 1,
        message: `source is ${bytes} bytes; the limit is ${maxBytes}`,
      },
    ];
  }
  if (source.includes('\u0000')) {
    return [{ file: 'scene.rs', line: 1, column: 1, message: 'source contains NUL bytes' }];
  }
  const code = stripComments(source);
  for (const [re, message] of FORBIDDEN) {
    const m = re.exec(code);
    if (m) {
      const { line, column } = position(code, m.index);
      errors.push({ file: 'scene.rs', line, column, message });
    }
  }
  errors.push(...compileTimeReads(source, code));
  if (!/\bpub\s+fn\s+project\s*\(\s*\)/.test(code)) {
    errors.push({
      file: 'scene.rs',
      line: 1,
      column: 1,
      message: 'define `pub fn project() -> Project`',
    });
  }
  return errors;
}

// Macros that read the build machine while compiling. The output is wasm the
// caller downloads, so they would carry out whatever they read; only what is
// public anyway is allowed.
const COMPILE_TIME = /\b(include_str|include_bytes|include|option_env|env)!\s*[({[]/g;
const PUBLIC_ENV = /^"(?:CARGO_MANIFEST_DIR|CARGO_CRATE_NAME|CARGO_PKG_[A-Z_]+)"$/;
// Absolute (`/x`, `\\x`, `C:x`) or climbing out (`..`).
const OUTSIDE = /^"(?:[\\/]|[A-Za-z]:)|(?:^"|[\\/])\.\.(?:[\\/]|")/;

/**
 * `env!` and `option_env!` may name only Cargo's own variables, and the
 * `include*!` macros only a relative path inside the project, both as a
 * plain string literal (not `concat!`, not another macro).
 */
function compileTimeReads(source: string, code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const m of code.matchAll(COMPILE_TIME)) {
    const open = m.index! + m[0].length;
    // `code` blanks string contents; the argument is read from the source.
    const literal = /^\s*("(?:[^"\\\n]|\\.)*")\s*[,)\]}]/.exec(source.slice(open))?.[1];
    const env = m[1] === 'env' || m[1] === 'option_env';
    const ok = literal !== undefined && (env ? PUBLIC_ENV.test(literal) : !OUTSIDE.test(literal));
    if (!ok) {
      const { line, column } = position(code, m.index!);
      errors.push({
        file: 'scene.rs',
        line,
        column,
        message: env
          ? `\`${m[1]}!\` can read only Cargo's own variables in the playground (CARGO_MANIFEST_DIR, CARGO_PKG_*)`
          : `\`${m[1]}!\` takes a relative path inside the project in the playground`,
      });
    }
  }
  return errors;
}

/** Replaces comments with spaces (keeps offsets) so commented-out code is not flagged. */
export function stripComments(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const raw = rawStringEnd(s, i);
    if (raw !== null) {
      out += s.slice(i, raw).replace(/[^\n]/g, ' ');
      i = raw;
      continue;
    }
    if (s.startsWith('//', i)) {
      const end = s.indexOf('\n', i);
      const stop = end === -1 ? s.length : end;
      out += ' '.repeat(stop - i);
      i = stop;
    } else if (s.startsWith('/*', i)) {
      let depth = 0;
      const start = i;
      while (i < s.length) {
        if (s.startsWith('/*', i)) {
          depth++;
          i += 2;
        } else if (s.startsWith('*/', i)) {
          depth--;
          i += 2;
          if (depth === 0) break;
        } else i++;
      }
      out += s.slice(start, i).replace(/[^\n]/g, ' ');
    } else if (s[i] === '"') {
      // Skip string literals so `"asm!("` in text is fine.
      const start = i++;
      while (i < s.length && s[i] !== '"') i += s[i] === '\\' ? 2 : 1;
      i++;
      out += '"' + ' '.repeat(Math.max(0, i - start - 2)) + '"';
    } else {
      out += s[i++];
    }
  }
  return out;
}

/** End index of a raw string (`r"…"`, `br##"…"##`) starting at `i`, or null. */
function rawStringEnd(s: string, i: number): number | null {
  if (i > 0 && /[A-Za-z0-9_]/.test(s[i - 1]!)) return null;
  let j = i;
  if (s[j] === 'b' || s[j] === 'c') j++;
  if (s[j] !== 'r') return null;
  j++;
  let hashes = 0;
  while (s[j] === '#') {
    hashes++;
    j++;
  }
  if (s[j] !== '"') return null;
  const closer = '"' + '#'.repeat(hashes);
  const k = s.indexOf(closer, j + 1);
  return k === -1 ? s.length : k + closer.length;
}

function position(s: string, index: number) {
  const before = s.slice(0, index);
  const line = before.split('\n').length;
  const column = index - before.lastIndexOf('\n');
  return { line, column };
}
