import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  getInitialModernTheme,
  normalizeModernTheme,
} from "../src/modern/theme/themeStorage.js";
import { buildLegacyHref } from "../src/modern/routing/legacyLink.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("normalizes legacy themes into the two modern themes", () => {
  for (const value of ["dark", "oled", "night-blue", "forest", "ocean"]) {
    assert.equal(normalizeModernTheme(value), "dark");
  }
  for (const value of ["light", "sepia", "premium-beige", undefined]) {
    assert.equal(normalizeModernTheme(value), "light");
  }
});

test("prefers an explicit stored theme over the system preference", () => {
  assert.equal(getInitialModernTheme("dark", false), "dark");
  assert.equal(getInitialModernTheme(null, true), "dark");
  assert.equal(getInitialModernTheme(null, false), "light");
});

test("builds a legacy URL without duplicating its prefix", () => {
  assert.equal(buildLegacyHref("/", ""), "/legacy");
  assert.equal(buildLegacyHref("/surah/1", "?ayah=2"), "/legacy/surah/1?ayah=2");
  assert.equal(buildLegacyHref("/legacy/surah/1", ""), "/legacy/surah/1");
});

test("defines the same semantic token contract for both themes", async () => {
  const tokens = await read("../src/modern/styles/tokens.css");
  for (const token of [
    "--modern-bg",
    "--modern-surface",
    "--modern-text",
    "--modern-muted",
    "--modern-border",
    "--modern-accent",
    "--modern-focus",
    "--modern-tap-size",
  ]) {
    assert.ok((tokens.match(new RegExp(`${token}:`, "g"))?.length || 0) >= 2, token);
  }
  assert.match(tokens, /\[data-modern-theme="dark"\]/);
});

test("bundles the editorial interface font locally", async () => {
  const modernStyles = await read("../src/modern/modern.css");
  assert.match(modernStyles, /@fontsource-variable\/literata/);
});
