import test from "node:test";
import assert from "node:assert/strict";
import { verifyAudioResponse, isVerifiedAudioResponse } from "../src/services/offlineAudioResponse.js";
test("offline verification rejects HTTP errors, empty media and HTML masquerading as audio", async () => {
  for (const response of [new Response("ID3xxx", { status: 404 }), new Response(""), new Response("<html>error</html>", { headers: { "Content-Type": "audio/mpeg" } }), { status: 0, type: "opaque" }]) {
    assert.equal(await verifyAudioResponse(response), null);
  }
});
test("offline verification counts actual bytes and leaves source readable", async () => {
  const source = new Response("RIFF1234WAVEdata", { headers: { "Content-Type": "audio/wav", "Content-Length": "999", "Content-Encoding": "gzip" } });
  const verified = await verifyAudioResponse(source);
  assert.equal(isVerifiedAudioResponse(verified), true);
  assert.equal(verified.headers.get("Content-Length"), "16");
  assert.equal(verified.headers.get("Content-Encoding"), null);
  assert.equal(await source.text(), "RIFF1234WAVEdata");
});
