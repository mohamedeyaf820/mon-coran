export default {
  testDir: "tests/e2e",
  testIgnore: ["**/*-debug.spec.mjs"],
  timeout: 60_000,
  workers: 2,
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
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    },
  },
  webServer: {
    command:
      "node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  reporter: [["list"]],
};
