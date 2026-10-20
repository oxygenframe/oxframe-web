// Writes build/_headers and build/_redirects for Cloudflare: the same
// headers and redirects serve.ts applies.
// Pages carry their CSP in a <meta> tag (SvelteKit hashes); the header adds
// only what meta cannot express. The engine worker is the one script allowed
// to compile wasm, so it gets its own CSP with 'wasm-unsafe-eval'.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileUrl } from '../compile-url.js';
import { REDIRECTS } from '../redirects';

const build = join(import.meta.dir, '../build');
// Same resolution as the build itself, so headers always match it.
const compile = compileUrl();

const workers = join(build, '_app/immutable/workers');
const engine = existsSync(workers)
  ? readdirSync(workers).filter((f) => /^engine-worker-.*\.js$/.test(f))
  : [];
if (engine.length !== 1)
  throw new Error(`expected one engine worker in ${workers}, found ${engine.length}`);

const pageCsp = `frame-ancestors 'self'; object-src 'none'; base-uri 'self'`;
const workerCsp = `default-src 'self'; connect-src 'self' ${compile}; script-src 'self' ${compile} 'wasm-unsafe-eval'`;

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: ${pageCsp}

/_app/immutable/*
  Cache-Control: public, max-age=31536000, immutable

/_app/immutable/workers/${engine[0]}
  ! Content-Security-Policy
  Content-Security-Policy: ${workerCsp}
`;
writeFileSync(join(build, '_headers'), headers);
writeFileSync(join(build, '_redirects'), REDIRECTS.map((r) => r.join(' ')).join('\n') + '\n');
console.log(`wrote build/_headers (compile service: ${compile}) and build/_redirects`);
