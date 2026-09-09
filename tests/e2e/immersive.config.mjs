import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'immersive-composition.spec.mjs',
  timeout: 60000,
  retries: 0,
  workers: 1,
  outputDir: '../../test-results/immersive',
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4181', serviceWorkers: 'block', headless: true },
});
