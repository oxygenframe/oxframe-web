import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import pkg from './package.json' with { type: 'json' };

// Standalone bundle for oxframe-cli: dist/index.html + editor.js + editor.css
// with stable names (the CLI embeds the directory as-is).
export default defineConfig({
  plugins: [svelte()],
  define: { __EDITOR_VERSION__: JSON.stringify(pkg.version) },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'editor.js',
        chunkFileNames: 'editor-[name].js',
        assetFileNames: (info) =>
          info.names?.some((n) => n.endsWith('.css')) ? 'editor.css' : '[name][extname]',
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
});
