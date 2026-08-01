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

test("service worker accepts commands only from a same-origin scoped client", () => {
  assert.match(sw, /function isTrustedClientMessage/);
  assert.match(sw, /sender\.origin === self\.location\.origin/);
  assert.match(sw, /sender\.href\.startsWith\(scope\.href\)/);
  assert.match(
    sw,
    /addEventListener\("message"[\s\S]*?if \(!isTrustedClientMessage\(event\)\) return/,
  );
});

test("service worker keeps an installable entry shell when the shell manifest is unavailable", () => {
  assert.match(sw, /let shellAssetUrls = \[\]/);
  assert.match(sw, /The entry assets parsed from index\.html still provide a usable shell/);
  assert.doesNotMatch(sw, /Unable to load app-shell manifest/);
});

test("service worker bounds runtime caches and awaits cache writes", () => {
  assert.match(sw, /const CACHE_LIMITS =/);
  assert.match(sw, /\[CACHE_NAME\]: 300/);
  assert.match(sw, /\[API_CACHE_NAME\]: 200/);
  assert.match(sw, /async function putBounded/);
  assert.doesNotMatch(sw, /(?<!await )cache\.put\(/);
  assert.doesNotMatch(
    sw,
    /response\.type\s*===\s*["']opaque["']/,
    "opaque responses must not be persisted as successful content",
  );
});

test("service worker does not precache optional PWA gallery screenshots", () => {
  const precache = sw.match(/const ASSETS_TO_CACHE = \[[\s\S]*?\];/)?.[0] || "";
  assert.ok(precache, "app shell precache list missing");
  assert.doesNotMatch(precache, /pwa-home-(?:wide|mobile)\.png/);
});

test("deployment headers allow same-origin geolocation for explicit opt-in", () => {
  const netlify = fs.readFileSync(new URL("../netlify.toml", import.meta.url), "utf8");
  const vercel = fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8");
  assert.match(netlify, /geolocation=\(self\)/);
  assert.match(vercel, /geolocation=\(self\)/);
});

test("PWA manifest exposes stable identity, coherent colors and dedicated install assets", () => {
  const manifest = JSON.parse(
    fs.readFileSync(new URL("../public/manifest.json", import.meta.url), "utf8"),
  );
  assert.equal(manifest.id, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.theme_color, "#0D5C4A");
  assert.equal(manifest.background_color, "#071A0F");
  assert.ok(
    manifest.icons.some(
      (icon) => icon.sizes === "192x192" && icon.purpose === "maskable",
    ),
  );
  assert.ok(
    manifest.icons.some(
      (icon) => icon.sizes === "512x512" && icon.purpose === "maskable",
    ),
  );
  assert.ok(
    manifest.shortcuts.every((shortcut) =>
      shortcut.icons?.some((icon) => icon.sizes === "96x96"),
    ),
  );
  assert.ok(
    manifest.screenshots.some(
      (screenshot) => screenshot.form_factor === "narrow",
    ),
  );
  const logo512 = fs.statSync(
    new URL("../public/logo-512.png", import.meta.url),
  );
  assert.ok(logo512.size < 150_000, `logo-512.png is ${logo512.size} bytes`);
});

test("iOS startup images are declared and available for phone and tablet formats", () => {
  const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const startupImages = [
    ...index.matchAll(
      /<link rel="apple-touch-startup-image" href="([^"]+)" media="([^"]+)"/g,
    ),
  ];
  assert.ok(startupImages.length >= 10);
  assert.ok(startupImages.some(([, , media]) => media.includes("390px")));
  assert.ok(startupImages.some(([, , media]) => media.includes("1024px")));
  for (const [, href] of startupImages) {
    assert.equal(
      fs.existsSync(new URL(`../public${href}`, import.meta.url)),
      true,
      `${href} is missing`,
    );
  }
});
