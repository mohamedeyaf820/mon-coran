import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

import {
  isAllowedExternalUrl,
  sanitizeHtml,
  sanitizeSvgMarkup,
} from "../src/lib/security.js";
import { buildCspPolicy } from "../scripts/cspPolicy.mjs";
import { auditDeploymentSecurityHeaders } from "../scripts/check-security-headers.mjs";
import {
  readLocalStorageWithSchema,
  writeLocalStorageJson,
  downloadProgressMapSchema,
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

function collectSourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) return collectSourceFiles(path);
    if (!/\.(jsx?|tsx?)$/.test(entry)) return [];
    return [path];
  });
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
  assert.match(csp, /img-src[^;]*https:\/\/www\.assabile\.com/);
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

test("security: all deployable root headers match the centralized policy", () => {
  assert.deepEqual(auditDeploymentSecurityHeaders(), []);
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

test("security: sanitizers reject encoded SVG URLs and dangerous HTML", () => {
  const previousWindow = globalThis.window;
  const previousDOMParser = globalThis.DOMParser;
  const previousXMLSerializer = globalThis.XMLSerializer;

  globalThis.window = {};
  globalThis.DOMParser = DOMParser;
  globalThis.XMLSerializer = XMLSerializer;

  try {
    const svg = sanitizeSvgMarkup(`
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="safe"><stop offset="1" /></linearGradient></defs>
        <rect fill="url(#safe)" filter="url(https://evil.example/filter.svg#x)" />
        <text style="fill:red" href="data:text/html;base64,PHNjcmlwdD4=">safe</text>
      </svg>
    `);
    assert.match(svg, /url\(#safe\)/);
    assert.doesNotMatch(svg, /evil\.example|data:text\/html|style=/i);

    const html = sanitizeHtml(`
      <span onclick="alert(1)" style="background:url(javascript:alert(1))">
        <img src="x" onerror="alert(1)" />
        <svg onload="alert(1)"><script>alert(1)</script></svg>
        <strong title="allowed" formaction="javascript:alert(1)">safe</strong>
      </span>
    `);
    assert.match(html, /safe/);
    assert.match(html, /title="allowed"/);
    assert.doesNotMatch(
      html,
      /onclick|onerror|style=|formaction|javascript:|<img|<svg|<script/i,
    );
  } finally {
    globalThis.window = previousWindow;
    globalThis.DOMParser = previousDOMParser;
    globalThis.XMLSerializer = previousXMLSerializer;
  }
});

test("security: source avoids raw HTML injection sinks", () => {
  const offenders = [];

  for (const file of collectSourceFiles("src")) {
    const source = readFileSync(file, "utf8");
    if (
      /dangerouslySetInnerHTML/.test(source) ||
      /\.innerHTML\s*=/.test(source) ||
      /insertAdjacentHTML\s*\(/.test(source)
    ) {
      offenders.push(relative(process.cwd(), file));
    }
  }

  assert.deepEqual(offenders, []);
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

test("storage: keeps a valid offline download registry across reloads", () => {
  globalThis.localStorage = createMockStorage();
  const registry = {
    "hafs:ar.alafasy:1": {
      key: "hafs:ar.alafasy:1",
      status: "done",
      surahNum: 1,
      reciterId: "ar.alafasy",
      reciterName: "Mishary Alafasy",
      riwaya: "hafs",
      total: 7,
      downloaded: 7,
      failedCount: 0,
      updatedAt: Date.now(),
    },
  };

  assert.equal(
    writeLocalStorageJson("mushaf_offline_progress_v2", registry),
    true,
  );
  assert.deepEqual(
    readLocalStorageWithSchema(
      "mushaf_offline_progress_v2",
      downloadProgressMapSchema,
      {},
    ),
    registry,
  );
});

test("storage: accepts an explicitly cancelled offline download", () => {
  const result = downloadProgressMapSchema.safeParse({
    "warsh:warsh-reader:114": {
      key: "warsh:warsh-reader:114",
      status: "cancelled",
      surahNum: 114,
      reciterId: "warsh-reader",
      riwaya: "warsh",
      total: 6,
      downloaded: 2,
      failedCount: 0,
      updatedAt: Date.now(),
    },
  });

  assert.equal(result.success, true);
});
