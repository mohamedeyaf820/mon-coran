/**
 * Contract: every CSS custom property this app reads is defined somewhere.
 *
 * A `var(--name)` that no file ever declares does not fail loudly: the browser
 * falls back to the declaration's initial value, so the rule quietly renders
 * transparent, default-coloured or zero-sized, and `--badge-font-size` style
 * mistakes (a `var()` with no fallback at all) become invisible one-off bugs.
 * This scan collects every usage in the shipped stylesheets and components,
 * every definition the runtime can produce, and fails on the difference.
 *
 * It is a ratchet, not a snapshot: DEFERRED is the audit's finding for the
 * surfaces another agent is fixing right now, and the test fails if a name
 * leaves that list *or* if a new one is added without being declared.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Names the audit found used-but-never-declared, grandfathered while their
 * owner (tokens/themes agent) lands the definitions. Shrink only.
 *
 * Measured on this working tree; each entry has a `var()` usage and no
 * declaration anywhere in src/, index.html or tailwind.config.js.
 */
const DEFERRED = new Set([
  "--accent-gold",
  "--ayah-idx",
  "--badge-font-size",
  "--badge-pad-x",
  "--badge-pad-y",
  "--badge-radius",
  "--badge-weight",
  "--color-gold-rgb",
  "--color-info-rgb",
  "--error-rgb",
  "--font-arabic-title",
  "--font-display",
  "--font-home-ui",
  "--font-mono",
  "--font-reading",
  "--font-serif",
  "--mp-fs",
  "--notes-panel-w",
  "--notes-panel-x",
  "--notes-panel-y",
  "--qc-verse-max-width",
  "--qc-verse-padding-x",
  "--qc-verse-padding-y",
  "--surface-base",
  "--surface-border",
  "--surface-elevated",
  "--surface-overlay",
  "--surface-soft",
  "--text-base",
  "--text-sm",
  "--text-xs",
  "--theme-primary-contrast",
  "--theme-surface-2",
  "--theme-surface-muted",
  "--theme-text-secondary",
  "--type-arabic-ui",
  "--type-ui-body",
  "--type-ui-meta",
  "--type-ui-section",
  "--type-ui-title",
]);

/**
 * Names written onto an element at runtime instead of in a stylesheet: React
 * inline-style objects (`{"--mfp-btn-bg": …}`) and `style.setProperty()` calls,
 * which the scanner below recognises by their literal name, plus the prefixes
 * built by string interpolation (`var(--tajwid-${ruleId})`), which no static
 * scan can resolve. Every entry must still appear in the tree, so an exemption
 * cannot outlive the code that justified it.
 */
const RUNTIME_SET_PREFIXES = ["--tajwid-"];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) walk(relative, files);
    else files.push(relative);
  }
  return files;
}

const ALL_FILES = walk("src");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8").replace(/\r\n/g, "\n");

/** Usage surface: what the audit scanned — shipped stylesheets and components. */
const USAGE_FILES = ALL_FILES.filter(
  (file) => file.startsWith("src/styles/") || file.endsWith(".jsx"),
);
/** Definition surface: everything that can declare or set a custom property. */
const DEFINITION_FILES = [
  ...ALL_FILES.filter((file) => /\.(css|js|jsx)$/.test(file)),
  ...(fs.existsSync(path.join(ROOT, "index.html")) ? ["index.html"] : []),
  ...(fs.existsSync(path.join(ROOT, "tailwind.config.js"))
    ? ["tailwind.config.js"]
    : []),
];

const VAR_USAGE = /var\(\s*['`"]?(--[A-Za-z0-9_-]*)(\$\{)?/g;
const DECLARATION = /(--[A-Za-z0-9_-]+)\s*:/g;
const QUOTED_KEY = /["'](--[A-Za-z0-9_-]+)["']\s*:/g;
const SET_PROPERTY = /setProperty\(\s*['`"](-{2}[A-Za-z0-9_-]+)/g;

test("the scan sees the surfaces it claims to scan", () => {
  assert.ok(USAGE_FILES.length > 50, `${USAGE_FILES.length} usage files is too few`);
  assert.ok(
    USAGE_FILES.some((file) => file.endsWith(".jsx")),
    "component usage must be part of the scan",
  );
  assert.ok(DEFINITION_FILES.includes("index.html"), "the shell can declare :root tokens");
});

const usages = new Map();
const definitions = new Set();
const interpolatedPrefixes = new Set();

/** Block comments carry prose about tokens, not token usage: themes4.css
 * documents `var(--danger, #b42318)` inside a comment, and a comment is not a
 * call site the browser ever resolves.
 */
const stripCssComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");

for (const file of USAGE_FILES) {
  const lines = stripCssComments(read(file)).split("\n");
  lines.forEach((line, index) => {
    for (const match of line.matchAll(VAR_USAGE)) {
      if (match[2]) interpolatedPrefixes.add(match[1]);
      else if (!usages.has(match[1])) usages.set(match[1], [`${file}:${index + 1}`]);
      else if (usages.get(match[1]).length < 3) usages.get(match[1]).push(`${file}:${index + 1}`);
    }
  });
}

for (const file of DEFINITION_FILES) {
  const source = read(file);
  for (const pattern of [DECLARATION, QUOTED_KEY]) {
    for (const match of source.matchAll(pattern)) definitions.add(match[1]);
  }
  for (const match of source.matchAll(SET_PROPERTY)) {
    definitions.add(match[1]);
  }
}

const isDeclared = (name) =>
  definitions.has(name) ||
  [...interpolatedPrefixes].some((prefix) => prefix && name.startsWith(prefix)) ||
  RUNTIME_SET_PREFIXES.some((prefix) => name.startsWith(prefix));

const undefinedTokens = [...usages.keys()]
  .filter((name) => !isDeclared(name))
  .sort();

test("no css custom property is used without ever being defined", () => {
  const undeclared = undefinedTokens.filter((name) => !DEFERRED.has(name));
  assert.deepEqual(
    undeclared,
    [],
    `used but never defined: ${undeclared
      .map((name) => `${name} (${usages.get(name).join(", ")})`)
      .join("; ")}`,
  );
});

test("the deferred list shrinks and never rots", () => {
  const stillUndefined = new Set(undefinedTokens);
  const fixed = [...DEFERRED].filter((name) => !stillUndefined.has(name));
  assert.deepEqual(
    fixed,
    [],
    `these tokens are defined now: ${fixed.join(", ")} — drop them from DEFERRED`,
  );
});

test("every runtime-set exemption still corresponds to real code", () => {
  const tree = DEFINITION_FILES.map((file) => read(file)).join("\n");
  for (const prefix of RUNTIME_SET_PREFIXES) {
    assert.ok(
      tree.includes(prefix),
      `${prefix} is exempted as runtime-set but no longer appears in the source`,
    );
  }
});

test("interpolated token names read as dynamic, not as typos", () => {
  // `var(`--tajwid-${ruleId}`)` in the word renderers resolves per tajweed rule
  // (--tajwid-ikhfa, --tajwid-idgham-warsh, …), and the themes do declare those.
  // Without the dynamic rule the scanner sees the truncated `--tajwid-` and
  // reports the false positive the audit warned about.
  assert.ok(interpolatedPrefixes.has("--tajwid-"), "the interpolated call site was detected");
  assert.match(read("src/styles/domains/themes4.css"), /--tajwid-[a-z-]+:/);
  assert.ok(
    isDeclared("--tajwid-ikhfa"),
    "a generated tajweed name must count as declared",
  );
});
