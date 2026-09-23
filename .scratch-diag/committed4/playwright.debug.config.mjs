import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config.mjs";

export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  workers: 1,
  projects: [
    {
      name: "debug-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
