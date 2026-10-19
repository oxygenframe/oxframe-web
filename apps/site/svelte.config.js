import adapter from '@sveltejs/adapter-static';
import { compileUrl } from './compile-url.js';

const compile = compileUrl();

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    // Static site: any host with Bun (serve.ts) or a CDN.
    adapter: adapter({ fallback: '404.html' }),
    // No 'unsafe-eval' anywhere. wasm is compiled only inside the engine
    // worker, whose own response header (serve.ts) adds 'wasm-unsafe-eval'.
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:'],
        'font-src': ['self', 'data:'],
        'connect-src': ['self', compile],
        'worker-src': ['self', 'blob:'],
        'object-src': ['none'],
        'base-uri': ['self'],
      },
    },
  },
};
