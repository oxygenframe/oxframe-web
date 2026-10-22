import { readFile } from 'node:fs/promises';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { compileUrl } from './compile-url.js';
import { highlight } from './highlight.js';

/** `import html from './x.rs?highlight'`: the file as highlighted HTML,
 *  rendered at build time (see highlight.js). Other languages are named by
 *  the extension before `.txt` (`x.tsx.txt`, `x.py.txt`, `x.html.txt`), which keeps the
 *  site's own tools from reading them as source. */
function highlightedSources(): Plugin {
  const suffix = '?highlight';
  return {
    name: 'highlighted-sources',
    // Before Vite's asset loader, which would turn a .txt file into a URL.
    enforce: 'pre',
    async load(id) {
      if (!id.endsWith(suffix)) return;
      const path = id.slice(0, -suffix.length);
      const source = await readFile(path, 'utf8');
      const ext = /\.(\w+)(?:\.txt)?$/.exec(path)?.[1];
      const lang =
        ext === 'tsx'
          ? 'tsx'
          : ext === 'py'
            ? 'python'
            : ext === 'html'
              ? 'html'
              : ext === 'sh'
                ? 'shellscript'
                : ext === 'json'
                  ? 'json'
                  : 'rust';
      return `export default ${JSON.stringify(await highlight(source, lang))};`;
    },
  };
}

export default defineConfig({
  plugins: [highlightedSources(), sveltekit()],
  // PUBLIC_* variables are read via import.meta.env at build time; the
  // compile URL is resolved in compile-url.js (same value as the CSP).
  envPrefix: ['VITE_', 'PUBLIC_'],
  define: { 'import.meta.env.PUBLIC_COMPILE_URL': JSON.stringify(compileUrl()) },
  // Workspace packages ship TypeScript sources; let Vite transform them in
  // SSR instead of handing raw .ts to Node.
  ssr: { noExternal: [/^@oxframe\//] },
  worker: { format: 'es' },
  build: { target: 'es2022' },
  server: { port: 5173, strictPort: true },
});
