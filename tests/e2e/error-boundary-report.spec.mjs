import { expect, test } from "@playwright/test";
import { buildSync } from "esbuild";
import { fileURLToPath } from "node:url";

const entry = `
import React from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./src/components/ErrorBoundary.jsx";

function Boom({ kind }) {
  if (kind === "render") throw new Error("render failure");
  if (kind === "chunk") throw new Error("Failed to fetch dynamically imported module: /assets/x.js");
  return React.createElement("p", null, "fine");
}

window.mount = (kind) => {
  document.documentElement.lang = "fr";
  createRoot(document.getElementById("root")).render(
    React.createElement(ErrorBoundary, null, React.createElement(Boom, { kind })),
  );
};
`;

const bundle = buildSync({
  stdin: { contents: entry, resolveDir: fileURLToPath(new URL("../../", import.meta.url)), loader: "jsx" },
  bundle: true,
  format: "iife",
  platform: "browser",
  write: false,
  jsx: "automatic",
  define: { "import.meta.env.DEV": "false", "import.meta.env": "{}" },
  loader: { ".json": "json" },
}).outputFiles[0].text;

test.beforeEach(async ({ page }) => {
  await page.route("**/qa-boundary.html", (route) =>
    route.fulfill({
      body: `<!doctype html><html lang="fr"><title>qa</title><body><div id="root"></div><script src="/qa-boundary.js"></script></body></html>`,
      contentType: "text/html",
    }),
  );
  await page.route("**/qa-boundary.js", (route) => route.fulfill({ body: bundle, contentType: "text/javascript" }));
  await page.goto("/qa-boundary.html");
});

test("a render failure offers a report that opens a GitHub draft, sent by nothing", async ({ page }) => {
  await page.evaluate(() => window.mount("render"));
  const report = page.getByRole("link", { name: "Signaler le problème" });
  await expect(report).toBeVisible();
  await expect(report).toHaveAttribute("target", "_blank");
  await expect(report).toHaveAttribute("rel", /noopener/);
  const href = new URL(await report.getAttribute("href"));
  expect(href.pathname).toMatch(/\/issues\/new$/);
  const body = href.searchParams.get("body");
  expect(body).toContain("Version :");
  expect(body).toContain("Page : /qa-boundary.html");
  // Reload and Home stay available next to it.
  await expect(page.getByRole("button", { name: "Recharger" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accueil" })).toBeVisible();
});

test("a missing code chunk is a content gap, not a bug to report", async ({ page }) => {
  await page.evaluate(() => {
    // Keep the single automatic reload of a stale chunk out of the test.
    sessionStorage.setItem("mushafplus-chunk-reload-at", String(Date.now()));
    window.mount("chunk");
  });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("link", { name: "Signaler le problème" })).toHaveCount(0);
});
