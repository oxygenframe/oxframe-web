import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { compileUrl } from './compile-url.js';

export default defineConfig({
  plugins: [sveltekit()],
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
