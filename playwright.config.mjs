import { defineConfig, devices } from "@playwright/test";

const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
const jsonOutputFile = process.env.PLAYWRIGHT_JSON_OUTPUT_FILE || undefined;

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
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumExecutablePath
          ? { executablePath: chromiumExecutablePath }
          : undefined,
      },
    },
    {
      name: "firefox",
      testMatch: ["**/cross-browser-smoke.spec.mjs"],
      use: {
        ...devices["Desktop Firefox"],
        launchOptions:
          process.platform === "win32"
            ? { env: { MOZ_DISABLE_CONTENT_SANDBOX: "1" } }
            : undefined,
      },
    },
    {
      name: "webkit",
      testMatch: ["**/cross-browser-smoke.spec.mjs"],
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "pwa-offline",
      testMatch: ["**/pwa-offline.spec.mjs"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumExecutablePath
          ? { executablePath: chromiumExecutablePath }
          : undefined,
      },
    },
  ],
  reporter: jsonOutputFile
    ? [["json", { outputFile: jsonOutputFile }]]
    : [
        ["html", { open: "never" }],
        ["list"],
      ],
});
