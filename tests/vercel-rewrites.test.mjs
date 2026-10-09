import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { parseRoutePath } from "../src/hooks/useUrlSync.js";

const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const spaRewrite = vercel.rewrites.find((rule) => rule.destination === "/index.html");
const matchesSpaFallback = (pathname) => new RegExp(`^${spaRewrite.source}$`).test(pathname);

// Routes the app resolves itself. If parseRoutePath learns a new one, it must
// be added here AND to the rewrite in vercel.json, otherwise production answers 404.
const APP_ROUTES = [
  "/surah/1",
  "/surah/114",
  "/surah/2/255",
  "/surah/2/255/",
  "/page/1",
  "/page/604",
  "/juz/1",
  "/juz/30",
  "/duas",
  "/duas/hisn",
  "/duas/hisn/27",
  "/duas/coran",
  "/duas/rabbana",
  "/duas/khatm",
  "/prieres",
  "/prires",
  "/surahs",
  // English and Arabic live under a language prefix.
  "/en/surah/2",
  "/ar/surah/114",
  "/en/surah/2/255",
  "/ar/page/604",
  "/en/juz/30",
  "/ar/duas/hisn/27",
  "/en/duas/coran",
  "/ar/prieres",
];

// Real 404s: the app would also answer "not found", but with a 200 status.
const UNKNOWN_ROUTES = [
  "/foo",
  "/surah/0",
  "/surah/115",
  "/surah",
  "/page/0",
  "/page/605",
  "/juz/31",
  "/duas/inconnu",
  "/duas/hisn/abc",
  "/wp-login.php",
  "/assets/index.js",
  // French is the root: there is no /fr, and other languages are not served.
  "/fr/surah/2",
  "/de/surah/2",
  "/en/surah/115",
  "/ar/duas/inconnu",
];

test("every route the app resolves falls back to the SPA shell", () => {
  for (const pathname of APP_ROUTES) {
    const resolved = parseRoutePath(pathname);
    assert.ok(!resolved.routeNotFound, `${pathname} should be an app route`);
    assert.ok(matchesSpaFallback(pathname), `${pathname} must be rewritten to /index.html`);
  }
});

test("unknown URLs are not rewritten, so they get a real 404", () => {
  for (const pathname of UNKNOWN_ROUTES) {
    assert.ok(!matchesSpaFallback(pathname), `${pathname} must not be rewritten`);
  }
});
