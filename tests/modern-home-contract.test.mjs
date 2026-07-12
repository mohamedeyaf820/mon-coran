import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("mounts the modern home inside the shared shell", async () => {
  const shell = await read("../src/modern/shell/ModernShell.jsx");
  assert.match(shell, /ModernHomePage/);
  assert.match(shell, /focusHomeSearch/);
});

test("home exposes resume, progress, recent and surah discovery surfaces", async () => {
  const home = await read("../src/modern/home/ModernHomePage.jsx");
  assert.match(home, /id="surah-search"/);
  assert.match(home, /Reprendre la lecture/);
  assert.match(home, /Progression globale/);
  assert.match(home, /Lectures recentes/);
  assert.match(home, /Explorer les sourates/);
  assert.match(home, /Aucune sourate ne correspond/);
});

test("home sends reading actions to valid modern reader URLs", async () => {
  const home = await read("../src/modern/home/ModernHomePage.jsx");
  assert.match(home, /model\.resume\.href/);
  assert.match(home, /recent\.href/);
  assert.match(home, /`\/surah\/\$\{surah\.n\}`/);
});

test("keeps the application background visually quiet", async () => {
  const shellStyles = await read("../src/modern/styles/shell.css");
  const appRule = shellStyles.match(/\.modern-app\s*\{[\s\S]*?\}/)?.[0] || "";
  assert.doesNotMatch(appRule, /linear-gradient|background-size/);
  assert.match(appRule, /background:\s*var\(--modern-bg\)/);
});
