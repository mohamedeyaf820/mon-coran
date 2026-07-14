import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("PWA manifest exposes installable metadata", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../public/manifest.json", import.meta.url), "latin1"));
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
});

test("service worker precaches the application entry for offline navigation", () => {
  const source = fs.readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(source, /const CACHE_NAME = "mon-coran-v7"/);
  assert.match(source, /"\/index\.html"/);
  assert.match(source, /networkFirstHtml/);
});
