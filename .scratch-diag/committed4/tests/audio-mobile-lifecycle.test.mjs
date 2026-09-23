import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window = { location: { href: 'https://qa.test/' } };
const documentListeners = new Map();
globalThis.document = {
  visibilityState: 'visible',
  hidden: false,
  addEventListener(name, fn) {
    if (!documentListeners.has(name)) documentListeners.set(name, new Set());
    documentListeners.get(name).add(fn);
  },
  removeEventListener(name, fn) {
    documentListeners.get(name)?.delete(fn);
  },
};
const fireVisibilityChange = async () => {
  for (const fn of documentListeners.get('visibilitychange') || []) fn();
  await new Promise((resolve) => setImmediate(resolve));
};
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
  const urls = [1, 2].map(n => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
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
  service.playlist = [{ surah: 1, ayah: 1, url: 'https://audio.qurancdn.com/Alafasy/mp3/001001.mp3' }];
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
  service.playlist = [{ surah: 1, ayah: 1, url: 'https://audio.qurancdn.com/Alafasy/mp3/001001.mp3' }];
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

test('a verse that fails to load in the background retries on return to the foreground', async () => {
  const service = new AudioService();
  const urls = [1, 2].map((n) => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, number: i + 1, url }));
  await service.loadAndPlay(0);
  assert.equal(service.isPlaying, true);

  document.visibilityState = 'hidden';
  document.hidden = true;
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  const workingPlay = service.audio.play.bind(service.audio);
  service.audio.play = () => {
    service.audio.paused = true;
    return Promise.reject(new DOMException('Background suspension', 'NotSupportedError'));
  };
  await service.loadAndPlay(1);
  assert.equal(service.isPlaying, false, 'a hidden-tab failure is not a playing session');

  document.visibilityState = 'visible';
  document.hidden = false;
  delete navigator.onLine;
  service.audio.play = workingPlay;
  await fireVisibilityChange();
  assert.equal(service.audio.paused, false);
  assert.equal(service.audio.src, urls[1]);
  assert.equal(service.isPlaying, true);
  service.destroy();
});

test('an OS interruption is not mistaken for the user pausing', async () => {
  const service = new AudioService();
  service.playlist = [{ surah: 1, ayah: 1, url: 'https://audio.qurancdn.com/Alafasy/mp3/001001.mp3' }];
  await service.loadAndPlay(0);
  service.audio.pause();
  service.audio.dispatchEvent(new Event('pause'));
  assert.equal(service.isPlaying, false);
  let resumed = 0;
  service.resume = () => { resumed++; return Promise.resolve(); };
  document.hidden = true;
  await fireVisibilityChange();
  assert.equal(resumed, 0, 'returning from hidden to hidden restarts nothing');
  document.hidden = false;
  await fireVisibilityChange();
  assert.equal(resumed, 1);
  service.destroy();
});

test('playback progress keeps reporting without requestAnimationFrame', async () => {
  const service = new AudioService();
  service.playlist = [{ surah: 1, ayah: 1, url: 'https://audio.qurancdn.com/Alafasy/mp3/001001.mp3' }];
  await service.loadAndPlay(0);
  document.visibilityState = 'hidden';
  document.hidden = true;
  assert.equal(globalThis.requestAnimationFrame, undefined);
  let reported = 0;
  service.onTimeUpdate = () => { reported++; };
  service.audio.currentTime = 7;
  service.audio.dispatchEvent(new Event('timeupdate'));
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.equal(reported, 1);
  document.visibilityState = 'visible';
  document.hidden = false;
  service.destroy();
});
