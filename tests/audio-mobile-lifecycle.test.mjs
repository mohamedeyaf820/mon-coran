import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window = { location: { href: 'https://qa.test/' } };
globalThis.Audio = class extends EventTarget {
  src = '';
  readyState = 4;
  currentTime = 0;
  duration = 30;
  paused = true;
  setAttribute() {}
  removeAttribute() { this.src = ''; }
  load() {}
  pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
};
const { AudioService } = await import('../src/services/audioService.js');

test('mobile playback requests a playback audio session and advances without animation frames', async () => {
  const audioSession = { type: 'auto' };
  Object.defineProperty(navigator, 'audioSession', { configurable: true, value: audioSession });
  const service = new AudioService();
  const urls = [1, 2].map(n => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, number: i + 1, url }));
  await service.loadAndPlay(0);
  assert.equal(audioSession.type, 'playback');
  // Background tabs may never execute requestAnimationFrame.
  globalThis.requestAnimationFrame = () => 1;
  service.audio.dispatchEvent(new Event('ended'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(service.audio.src, urls[1]);
  assert.equal(service.isPlaying, true);
  service.destroy();
  delete globalThis.requestAnimationFrame;
  delete navigator.audioSession;
});

test('a blocked native play is reported as paused, never as successful playback', async () => {
  const service = new AudioService();
  const blocked = new DOMException('User activation required', 'NotAllowedError');
  service.audio.play = () => Promise.reject(blocked);
  service.playlist = [{ surah: 1, ayah: 1, url: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3' }];
  let error;
  let played = false;
  service.onError = value => { error = value; };
  service.onPlay = () => { played = true; };
  await service.loadAndPlay(0);
  assert.equal(service.isPlaying, false);
  assert.equal(played, false);
  assert.equal(error, blocked);
  service.destroy();
});

test('flat equalizer preserves the native audio path', () => {
  const service = new AudioService();
  let contexts = 0;
  window.AudioContext = class { constructor() { contexts++; } };
  service.applyEqPreset('flat');
  assert.equal(contexts, 0);
  service.destroy();
  delete window.AudioContext;
});

test('OS pause and resume events update the controls without forcing playback', async () => {
  const service = new AudioService();
  service.playlist = [{ surah: 1, ayah: 1, url: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3' }];
  await service.loadAndPlay(0);
  let paused = 0;
  service.onPause = () => { paused++; };
  service.audio.dispatchEvent(new Event('pause'));
  assert.equal(service.isPlaying, false);
  assert.equal(paused, 1);
  service.audio.dispatchEvent(new Event('playing'));
  assert.equal(service.isPlaying, true);
  service.destroy();
});
