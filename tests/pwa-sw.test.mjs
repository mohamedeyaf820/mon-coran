import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sw = fs.readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

test("service worker waits for user confirmation before activating an update", () => {
  const installHandler = sw.match(/addEventListener\("install"[\s\S]*?\n\}\);/)?.[0] || "";
  assert.ok(installHandler, "install handler missing");
  assert.doesNotMatch(installHandler, /skipWaiting/);
  assert.match(sw, /case "SKIP_WAITING"/);
});

test("service worker bounds runtime caches and awaits cache writes", () => {
  assert.match(sw, /const CACHE_LIMITS =/);
  assert.match(sw, /async function putBounded/);
  assert.doesNotMatch(sw, /(?<!await )cache\.put\(/);
});

test("deployment headers allow same-origin geolocation for explicit opt-in", () => {
  const netlify = fs.readFileSync(new URL("../netlify.toml", import.meta.url), "utf8");
  const vercel = fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8");
  assert.match(netlify, /geolocation=\(self\)/);
  assert.match(vercel, /geolocation=\(self\)/);
});
