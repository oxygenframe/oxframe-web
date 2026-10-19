import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // PUBLIC_COMPILE_URL and friends are read via import.meta.env at build time.
  envPrefix: ['VITE_', 'PUBLIC_'],
  // Workspace packages ship TypeScript sources; let Vite transform them in
  // SSR instead of handing raw .ts to Node.
  ssr: { noExternal: [/^@oxframe\//] },
  worker: { format: 'es' },
  build: { target: 'es2022' },
  server: { port: 5173, strictPort: true },
});
