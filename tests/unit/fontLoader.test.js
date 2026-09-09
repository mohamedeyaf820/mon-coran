import test from "node:test";
import assert from "node:assert/strict";

test("QCF loading requires a real matching face even under automation", async () => {
  const originals = Object.getOwnPropertyDescriptors(globalThis);
  const faces = new Set();
  const requests = [];
  let fail = false;
  try {
    globalThis.window = { __playwright__: true };
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { webdriver: true } });
    globalThis.document = { fonts: faces };
    globalThis.FontFace = class {
      constructor(family, source) {
        this.family = family;
        this.source = source;
      }
      async load() {
        requests.push(this.source);
        if (fail) throw new Error("offline");
        this.status = "loaded";
        return this;
      }
    };
    const { ensureFontLoaded } = await import(`../../src/services/fontLoader.js?test=${Date.now()}`);
    assert.equal((await ensureFontLoaded("qcf-v2", { page: 564 })).loaded, true);
    assert.equal((await ensureFontLoaded("qcf-v2", { page: 566 })).loaded, true);
    assert.equal(requests.length, 2, "generic font ID must not reuse another page's success");
    assert.match(requests[0], /v2\/woff2\/p564\.woff2/);
    assert.match(requests[1], /v2\/woff2\/p566\.woff2/);
    assert.equal(faces.size, 2);
    fail = true;
    assert.equal((await ensureFontLoaded("qcf-v4-p564")).loaded, false);
    fail = false;
    assert.equal((await ensureFontLoaded("qcf-v4-p564")).loaded, true);
    delete globalThis.FontFace;
    assert.equal((await ensureFontLoaded("qcf-v2-p567")).loaded, false);
    assert.equal((await ensureFontLoaded("qcf-v2-p567")).loaded, false);
  } finally {
    for (const key of ["window", "navigator", "document", "FontFace"]) {
      if (originals[key]) Object.defineProperty(globalThis, key, originals[key]);
      else delete globalThis[key];
    }
  }
});
