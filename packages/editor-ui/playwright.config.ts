import { defineConfig } from '@playwright/test';

// Runs the standalone editor against the in-page mock engine.
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4174', viewport: { width: 1280, height: 800 } },
  webServer: {
    // Explicit IPv4 host: `localhost` can resolve to ::1 on CI runners, and
    // then the server never answers on the URL below.
    command: 'bunx vite preview --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: true,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
