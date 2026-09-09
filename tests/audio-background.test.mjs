import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate as nextTurn } from "node:timers/promises";

class NativeAudio extends EventTarget {
  constructor() {
    super();
    this.src = "";
    this.currentTime = 0;
    this.duration = 30;
    this.readyState = 2;
    this.paused = true;
    this.ended = false;
    this.playbackRate = 1;
    this.playCalls = 0;
  }
  setAttribute() {}
  removeAttribute() { this.src = ""; }
  load() {}
  pause() { this.paused = true; this.dispatchEvent(new Event("pause")); }
  play() {
    this.playCalls++;
    this.paused = false;
    this.ended = false;
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  }
}
globalThis.Audio = NativeAudio;
globalThis.window = { location: { href: "http://localhost/" } };
// A locked screen never delivers animation callbacks.
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
const { AudioService } = await import("../src/services/audioService.js");

function createService() {
  const service = new AudioService();
  service.loadPlaylist([
    { surah: 1, numberInSurah: 7, number: 7 },
    { surah: 2, numberInSurah: 1, number: 8 },
  ], "ar.alafasy");
  return service;
}

test("next page queue resolves in the native engine without animation frames", async () => {
  const service = createService();
  const element = service.audio;
  await service.play();
  const started = await service.continuePlaylist(async () => [
    { surah: 2, numberInSurah: 2, number: 9 },
  ], "ar.alafasy");
  assert.equal(started, true);
  assert.equal(service.audio, element);
  assert.equal(service.currentAyah.ayah, 2);
  service.destroy();
});

test("pause during next-page data loading cancels the background handoff", async () => {
  const service = createService();
  await service.play();
  let resolveNext;
  const pending = service.continuePlaylist(() => new Promise(resolve => { resolveNext = resolve; }), "ar.alafasy");
  const previousPlaylist = service.playlist;
  service.pause();
  resolveNext([{ surah: 2, numberInSurah: 2, number: 9 }]);
  assert.equal(await pending, false);
  assert.equal(service.playlist, previousPlaylist);
  assert.equal(service.audio.paused, true);
  service.destroy();
});

test("background media advances between surahs on the same element without animation frames", async () => {
  const service = createService();
  const element = service.audio;
  const times = [];
  service.addTimeUpdateListener(time => times.push(time));
  await service.play();
  element.currentTime = 12;
  element.dispatchEvent(new Event("timeupdate"));
  element.currentTime = 13;
  element.dispatchEvent(new Event("timeupdate"));
  assert.deepEqual(times, [12, 13]);
  element.ended = true;
  element.dispatchEvent(new Event("ended"));
  await nextTurn();
  assert.equal(service.audio, element);
  assert.equal(service.currentAyah.surah, 2);
  assert.equal(service.isPlaying, true);
  assert.match(element.src, /\/8\.mp3$/);
  service.destroy();
});

for (const action of ["stop", "switchReciter", "loadPlaylist"]) {
  test(`${action} cancels a pending scope handoff`, async () => {
    const service = createService();
    let resolveNext;
    const pending = service.continuePlaylist(() => new Promise(resolve => { resolveNext = resolve; }), "ar.alafasy");
    if (action === "loadPlaylist") service.loadPlaylist([{ surah: 3, numberInSurah: 1, number: 294 }], "ar.alafasy");
    else if (action === "switchReciter") await service.switchReciter("ar.husary");
    else service.stop();
    const playlist = service.playlist;
    resolveNext([{ surah: 2, numberInSurah: 2, number: 9 }]);
    assert.equal(await pending, false);
    assert.equal(service.playlist, playlist);
    service.destroy();
  });
}

test("superseding playback after data resolves cannot complete an old handoff", async () => {
  const service = createService();
  let finishPlay;
  const play = service.audio.play.bind(service.audio);
  service.audio.play = () => new Promise(resolve => { finishPlay = resolve; });
  const pending = service.continuePlaylist(async () => [{ surah: 2, numberInSurah: 2, number: 9 }], "ar.alafasy");
  await nextTurn();
  service.pause();
  service.audio.play = play;
  await service.play();
  finishPlay();
  assert.equal(await pending, false);
  assert.equal(service.isPlaying, true);
  service.destroy();
});

test("same-scope metadata refresh does not cancel a pending boundary", async () => {
  const service = createService();
  let resolveNext;
  const pending = service.continuePlaylist(() => new Promise(resolve => { resolveNext = resolve; }), "ar.alafasy");
  service.loadPlaylist(service._playlistSourceAyahs, "ar.alafasy");
  resolveNext([{ surah: 2, numberInSurah: 2, number: 9 }]);
  assert.equal(await pending, true);
  service.destroy();
});

test("autoplay denial keeps playback paused without reciter failover or retry", async () => {
  const service = createService();
  let errors = 0;
  service.onError = () => errors++;
  service.audio.play = () => {
    service.audio.playCalls++;
    return Promise.reject(new DOMException("User gesture required", "NotAllowedError"));
  };
  await service.play();
  assert.equal(service.isPlaying, false);
  assert.equal(errors, 0);
  assert.equal(service.audio.playCalls, 1);
  assert.equal(service.currentAyah.ayah, 7);
  service.destroy();
});

test("pausing a pending track cancels it and ignores its later play resolution", async () => {
  const service = createService();
  let finishPlay;
  service.audio.play = () => new Promise(resolve => { finishPlay = resolve; });
  const pending = service.play();
  service.pause();
  finishPlay();
  await pending;
  assert.equal(service.isPlaying, false);
  assert.equal(service.audio.paused, true);
  assert.equal(service._cancelPendingLoad, null);
  service.destroy();
});

test("native pause updates application state without a Web Audio graph", async () => {
  const service = createService();
  await service.play();
  assert.equal(service._audioCtx, undefined);
  service.audio.pause();
  assert.equal(service.isPlaying, false);
  service.destroy();
});
