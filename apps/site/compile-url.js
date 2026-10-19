// The one place that decides where the playground's compile service is.
// Read by svelte.config.js (CSP), vite.config.ts (the app), serve.ts and
// scripts/cf-headers.ts, so the site, its CSP and its headers always agree.
//
// PUBLIC_COMPILE_URL wins; otherwise a build on Cloudflare Workers Builds
// (WORKERS_CI=1) talks to production and everything else to a local
// compile-service (`bun run dev`).
export const LOCAL_COMPILE_URL = 'http://127.0.0.1:8787';
export const PRODUCTION_COMPILE_URL = 'https://compile.oxframe.dev';

/** @param {Record<string, string | undefined>} env */
export function compileUrl(env = process.env) {
  if (env.PUBLIC_COMPILE_URL) return env.PUBLIC_COMPILE_URL;
  return env.WORKERS_CI === '1' ? PRODUCTION_COMPILE_URL : LOCAL_COMPILE_URL;
}
