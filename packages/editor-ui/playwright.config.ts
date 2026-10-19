import { defineConfig } from '@playwright/test';

// Runs the standalone editor against the in-page mock engine.
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4174', viewport: { width: 1280, height: 800 } },
  webServer: {
    command: 'bunx vite preview --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: true,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
