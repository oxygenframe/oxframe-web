// Writes build/_headers and build/_redirects for Cloudflare: the same
// headers and redirects serve.ts applies.
// Pages carry their CSP in a <meta> tag (SvelteKit hashes); the header adds
// only what meta cannot express. The engine worker is the one script allowed
// to compile wasm, so it gets its own CSP with 'wasm-unsafe-eval'; so does the
// docs search worker (Pagefind) and the <oxframe-player> worker. player.js and
// player-worker.js are loaded by other sites, so they allow any origin.
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
const search = existsSync(workers)
  ? readdirSync(workers).filter((f) => /^search-worker-.*\.js$/.test(f))
  : [];
if (search.length !== 1)
  throw new Error(`expected one search worker in ${workers}, found ${search.length}`);

const pageCsp = `frame-ancestors 'self'; object-src 'none'; base-uri 'self'`;
const workerCsp = `default-src 'self'; connect-src 'self' ${compile}; script-src 'self' ${compile} 'wasm-unsafe-eval'`;
const searchCsp = `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'`;

// The Markdown copy of a page (docs/editor.md, for agents) points search
// engines at the page itself, or they report it as a duplicate.
const markdown: string[] = [];
const walk = (dir: string, rel: string) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name !== '_app') walk(join(dir, e.name), `${rel}/${e.name}`);
    } else if (e.name.endsWith('.md')) {
      markdown.push(`${rel}/${e.name}`);
    }
  }
};
walk(build, '');
const canonical = markdown
  .sort()
  .map((md) => {
    const page = md.replace(/\.md$/, '').replace(/\/index$/, '') || '/';
    return `${md}\n  Link: <https://oxframe.dev${page}>; rel="canonical"\n`;
  })
  .join('\n');

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: ${pageCsp}

/_app/immutable/*
  Cache-Control: public, max-age=31536000, immutable

/_app/immutable/workers/${engine[0]}
  ! Content-Security-Policy
  Content-Security-Policy: ${workerCsp}

/_app/immutable/workers/${search[0]}
  ! Content-Security-Policy
  Content-Security-Policy: ${searchCsp}

/player.js
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600

/player-worker.js
  ! Content-Security-Policy
  Content-Security-Policy: ${workerCsp}
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600

${canonical}`;
// Cloudflare reads at most 100 rules from _headers.
const ruleCount = headers.split('\n').filter((l) => l.startsWith('/')).length;
if (ruleCount > 100) throw new Error(`_headers: ${ruleCount} rules, Cloudflare allows 100`);
writeFileSync(join(build, '_headers'), headers);
// Cloudflare counts every rule after the first splat as dynamic and allows
// 100 of those, so exact paths go first. Each exact path is checked before
// the splats in redirectFor as well, so the order does not change a match.
const dynamic = (from: string) => from.includes('*') || from.includes('/:');
const rules = [
  ...REDIRECTS.filter(([from]) => !dynamic(from)),
  ...REDIRECTS.filter(([from]) => dynamic(from)),
];
const splats = rules.filter(([from]) => dynamic(from)).length;
if (splats > 100) throw new Error(`_redirects: ${splats} dynamic rules, Cloudflare allows 100`);
writeFileSync(join(build, '_redirects'), rules.map((r) => r.join(' ')).join('\n') + '\n');
console.log(`wrote build/_headers (compile service: ${compile}) and build/_redirects`);
