import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const context = vm.createContext({ self: { addEventListener() {} }, URL, Response });
vm.runInContext(source, context);
const range = context.createPartialResponse;
const response = () => new Response("0123456789", { headers: { "Content-Type": "audio/mpeg" } });
test("offline audio supports suffix and clamped byte ranges", async () => {
  const suffix = await range(response(), "bytes=-3");
  assert.equal(suffix.status, 206); assert.equal(await suffix.text(), "789");
  const end = await range(response(), "bytes=7-99");
  assert.equal(end.headers.get("Content-Range"), "bytes 7-9/10");
  assert.equal(await end.text(), "789");
});
test("unsupported ranges return an unconsumed full response", async () => {
  for (const value of ["invalid", "bytes=0-1,4-5", "bytes=-", "prefix bytes=0-1"]) {
    const result = await range(response(), value);
    assert.equal(result.status, 200); assert.equal(await result.text(), "0123456789");
  }
});
test("unsatisfiable ranges return the resource size", async () => {
  for (const value of ["bytes=20-", "bytes=-0", "bytes=8-4"]) {
    const result = await range(response(), value);
    assert.equal(result.status, 416); assert.equal(result.headers.get("Content-Range"), "bytes */10");
  }
});
