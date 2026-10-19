import { defineConfig } from '@playwright/test';

// Integration: the built site + a real compile-service (local runner, so a
// Rust toolchain with the wasm32 target is required). Build the site first,
// with the same compile URL: to keep a running `bun run dev` (port 8787) out
// of the way, use e.g.
//   PUBLIC_COMPILE_URL=http://127.0.0.1:8788 bun run build && COMPILE_PORT=8788 bunx playwright test
const compilePort = process.env.COMPILE_PORT ?? '8787';
const compileUrl = `http://127.0.0.1:${compilePort}`;

export default defineConfig({
  testDir: 'e2e',
  timeout: 420_000,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1400, height: 860 } },
  webServer: [
    {
      command: `PORT=4173 PUBLIC_COMPILE_URL=${compileUrl} bun serve.ts`,
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
    },
    {
      command: `PORT=${compilePort} RUNNER=local CORS_ORIGINS=http://127.0.0.1:4173 bun ../../services/compile/src/index.ts`,
      url: `${compileUrl}/healthz`,
      reuseExistingServer: true,
      timeout: 600_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        // WebGPU when the machine has a GPU; otherwise the engine falls back
        // to the CPU renderer and the tests still pass.
        launchOptions: {
          args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=vulkan'],
        },
      },
    },
  ],
});
