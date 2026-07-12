import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("modern root mounts the theme provider and semantic shell", async () => {
  const root = await read("../src/modern/ModernRoot.jsx");
  assert.match(root, /ModernThemeProvider/);
  assert.match(root, /ModernShell/);
});

test("modern shell exposes its essential accessible landmarks", async () => {
  const shell = await read("../src/modern/shell/ModernShell.jsx");
  assert.match(shell, /SkipLink/);
  assert.match(shell, /<header/);
  assert.match(shell, /<nav/);
  assert.match(shell, /<main/);
  assert.match(shell, /aria-label="Navigation principale"/);
  assert.match(shell, /Ouvrir l'interface legacy/);
  assert.match(shell, /modern-arabic/);
});

test("icon buttons require an accessible label", async () => {
  const button = await read("../src/modern/ui/IconButton.jsx");
  assert.match(button, /aria-label/);
  assert.match(button, /title=/);
});
