import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '../tests/e2e', timeout: 60000, retries: 0, workers: 1,
  outputDir: '../test-results/recitation',
  use: { baseURL: 'http://127.0.0.1:4182', serviceWorkers: 'block', headless: true, screenshot: 'only-on-failure' },
  reporter: [['list']],
});
