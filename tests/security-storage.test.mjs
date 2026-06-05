import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

import { isAllowedExternalUrl, sanitizeSvgMarkup } from "../src/lib/security.js";
import { buildCspPolicy } from "../scripts/cspPolicy.mjs";
import {
  readLocalStorageWithSchema,
  writeLocalStorageJson,
  memorizationMapSchema,
} from "../src/services/storageValidation.js";

function createMockStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test("security: allows only whitelisted https hosts", () => {
  assert.equal(isAllowedExternalUrl("https://wa.me/?text=ok"), true);
  assert.equal(isAllowedExternalUrl("https://twitter.com/test"), true);
  assert.equal(isAllowedExternalUrl("https://evil.example.com"), false);
  assert.equal(isAllowedExternalUrl("https://ia800304.us.archive.org/audio/test.mp3"), false);
  assert.equal(isAllowedExternalUrl("javascript:alert(1)"), false);
});

test("security: production CSP excludes dev-only and unused risky sources", () => {
  const csp = buildCspPolicy("production");
  assert.equal(csp.includes("'unsafe-eval'"), false);
  assert.equal(csp.includes("ia800304.us.archive.org"), false);
  assert.equal(csp.includes("ws://localhost"), false);
});

test("security: deployment CSP headers match the generated production policy", () => {
  const generated = buildCspPolicy("production");
  const netlify = readFileSync("netlify.toml", "utf8").match(
    /Content-Security-Policy = "([^"]+)"/,
  )?.[1];
  const vercelRoot = JSON.parse(readFileSync("vercel.json", "utf8")).headers.find(
    (entry) => entry.source === "/(.*)",
  );
  const vercel = vercelRoot?.headers.find(
    (header) => header.key === "Content-Security-Policy",
  )?.value;

  assert.equal(netlify, generated);
  assert.equal(vercel, generated);
});

test("security: SVG sanitizer strips active content and external references", () => {
  const previousWindow = globalThis.window;
  const previousDOMParser = globalThis.DOMParser;
  const previousXMLSerializer = globalThis.XMLSerializer;

  globalThis.window = {};
  globalThis.DOMParser = DOMParser;
  globalThis.XMLSerializer = XMLSerializer;

  try {
    const clean = sanitizeSvgMarkup(`
      <svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
        <style>@import url(https://evil.example.com/a.css)</style>
        <script>alert(1)</script>
        <foreignObject><div onclick="alert(1)">x</div></foreignObject>
        <use href="https://evil.example.com/icon.svg#x" />
        <text onclick="alert(1)" style="background:url(javascript:alert(1))">ok</text>
        <path d="M0 0 L1 1" />
      </svg>
    `);

    assert.match(clean, /<svg/);
    assert.match(clean, /<path/);
    assert.match(clean, />ok</);
    assert.doesNotMatch(clean, /script/i);
    assert.doesNotMatch(clean, /style=/i);
    assert.doesNotMatch(clean, /<style/i);
    assert.doesNotMatch(clean, /foreignObject/i);
    assert.doesNotMatch(clean, /<use/i);
    assert.doesNotMatch(clean, /onload|onclick/i);
    assert.doesNotMatch(clean, /evil\.example\.com|javascript:/i);
  } finally {
    globalThis.window = previousWindow;
    globalThis.DOMParser = previousDOMParser;
    globalThis.XMLSerializer = previousXMLSerializer;
  }
});

test("storage: rejects invalid localStorage key format", () => {
  globalThis.localStorage = createMockStorage();
  const ok = writeLocalStorageJson("bad key with space", { a: 1 });
  assert.equal(ok, false);
});

test("storage: validates schema and returns fallback on corruption", () => {
  globalThis.localStorage = createMockStorage();
  localStorage.setItem("mushafplus_memorization_v1", JSON.stringify({ "x:y": 99 }));

  const fallback = {};
  const value = readLocalStorageWithSchema(
    "mushafplus_memorization_v1",
    memorizationMapSchema,
    fallback,
  );

  assert.deepEqual(value, fallback);
});
