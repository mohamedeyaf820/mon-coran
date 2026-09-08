import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
test("asset recovery never clears cached content while offline", () => {
  const handlers = new Map(); let touched = false;
  vm.runInNewContext(fs.readFileSync(new URL("../public/boot-recovery.js", import.meta.url), "utf8"), {
    window: { addEventListener: (event, handler) => handlers.set(event, handler) },
    navigator: { onLine: false },
    sessionStorage: { getItem() { touched = true; return null; } },
    document: { getElementById: () => null },
  });
  handlers.get("error")({ target: { src: "https://example.com/assets/missing.js" } });
  assert.equal(touched, false);
});
