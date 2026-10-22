import adapter from '@sveltejs/adapter-static';
import { compileUrl } from './compile-url.js';
import { highlightCode } from './highlight.js';

const compile = compileUrl();

/** @type {import('@sveltejs/kit').Config} */
export default {
  // Code blocks are highlighted at build time (highlight.js).
  preprocess: [highlightCode()],
  kit: {
    // Static site: any host with Bun (serve.ts) or a CDN.
    adapter: adapter({ fallback: '404.html' }),
    prerender: {
      // /media/* (rendered videos and posters) comes from R2 through the
      // site Worker, not from the build; every other missing link fails it.
      handleHttpError: ({ path, message }) => {
        if (path.startsWith('/media/')) return;
        throw new Error(message);
      },
    },
    // No 'unsafe-eval' anywhere. wasm is compiled only inside the engine
    // worker, whose own response header (serve.ts) adds 'wasm-unsafe-eval'.
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        // Plausible analytics (routes/+layout.svelte) loads its script and
        // posts events to its own origin.
        'script-src': ['self', 'https://plausible.io'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:'],
        'font-src': ['self', 'data:'],
        'connect-src': ['self', compile, 'https://plausible.io'],
        'worker-src': ['self', 'blob:'],
        'object-src': ['none'],
        'base-uri': ['self'],
      },
    },
  },
};
