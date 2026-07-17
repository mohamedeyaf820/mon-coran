import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  testIgnore: ["**/*-debug.spec.mjs"],
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.025,
    },
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      testIgnore: ["**/*-debug.spec.mjs", "**/pwa-offline.spec.mjs"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testMatch: ["**/cross-browser-smoke.spec.mjs"],
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testMatch: ["**/cross-browser-smoke.spec.mjs"],
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "pwa-offline",
      testMatch: ["**/pwa-offline.spec.mjs"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [
    ["html", { open: "never" }],
    ["list"]
  ],
});
