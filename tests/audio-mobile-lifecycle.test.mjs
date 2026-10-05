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

test('audio focus claims pause other audio without pausing their own recitation', async () => {
  const bus = new EventTarget();
  const savedEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = class extends Event {
    constructor(type, options) { super(type); this.detail = options?.detail; }
  };
  window.addEventListener = bus.addEventListener.bind(bus);
  window.removeEventListener = bus.removeEventListener.bind(bus);
  window.dispatchEvent = bus.dispatchEvent.bind(bus);
  const service = new AudioService();
  try {
    service.playlist = [{ surah: 1, ayah: 1, url: 'https://audio.qurancdn.com/Alafasy/mp3/001001.mp3' }];
    await service.loadAndPlay(0);
    assert.equal(service.audio.paused, false);
    service.audio.currentTime = 14;
    window.dispatchEvent(new CustomEvent('mushafplus-playback-claim', { detail: { owner: 'word' } }));
    assert.equal(service.audio.paused, true);
    assert.equal(service.currentTime, 14);
    assert.equal(service.playlistIndex, 0);
    await service.resume();
    assert.equal(service.audio.paused, false);
    window.dispatchEvent(new CustomEvent('mushafplus-playback-claim', { detail: { owner: 'adhan' } }));
    assert.equal(service.audio.paused, true);
  } finally {
    service.destroy();
    globalThis.CustomEvent = savedEvent;
    delete window.addEventListener;
    delete window.removeEventListener;
    delete window.dispatchEvent;
  }
});

test('mobile playback requests a playback audio session and advances without animation frames', async () => {
  const audioSession = { type: 'auto' };
  Object.defineProperty(navigator, 'audioSession', { configurable: true, value: audioSession });
  const service = new AudioService();
  const urls = [1, 2].map(n => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, number: i + 1, url }));
  const starting = service.loadAndPlay(0);
  assert.equal(audioSession.type, 'playback', 'native playback is prepared before async loading');
  await starting;
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


const url = 'https://audio.qurancdn.com/Alafasy/mp3/001001.mp3';
const flush = () => new Promise(resolve => setImmediate(resolve));

test('OS interruption preserves position and never resumes on foreground return', async () => {
  const service = new AudioService();
  service.playlist = [{ surah: 1, ayah: 1, url }];
  await service.loadAndPlay(0);
  service.audio.currentTime = 12;
  service.audio.pause();
  service.audio.dispatchEvent(new Event('pause'));
  assert.equal(service.state, 'INTERRUPTED');
  let resumed = 0;
  service.resume = () => { resumed++; };
  document.hidden = true;
  await fireVisibilityChange();
  document.hidden = false;
  await fireVisibilityChange();
  assert.equal(resumed, 0);
  assert.equal(service.audio.currentTime, 12);
  service.destroy();
});

test('pause cancels an unresolved load and prevents a late play', async () => {
  const service = new AudioService();
  service.playlist = [{ surah: 1, ayah: 1, url }];
  const starting = service.loadAndPlay(0);
  service.pause();
  await starting;
  assert.equal(service.state, 'PAUSED_BY_USER');
  assert.equal(service.audio.paused, true);
  service.destroy();
});

test('hidden NotAllowedError is interrupted, without retry timers or optimistic playing', async () => {
  const service = new AudioService();
  service.playlist = [1, 2].map(n => ({ surah: 1, ayah: n, url: url.replace('001001', `00100${n}`) }));
  await service.loadAndPlay(0);
  document.hidden = true;
  service.audio.play = () => { service.audio.paused = true; return Promise.reject(new DOMException('Blocked', 'NotAllowedError')); };
  service.audio.dispatchEvent(new Event('ended'));
  await flush();
  assert.equal(service.playlistIndex, 1);
  assert.equal(service.isPlaying, false);
  assert.equal(service.state, 'INTERRUPTED');
  document.hidden = false;
  service.destroy();
});

test('native progress is emitted while animation frames are suspended', async () => {
  const service = new AudioService();
  service.playlist = [{ surah: 1, ayah: 1, url }];
  await service.loadAndPlay(0);
  globalThis.requestAnimationFrame = () => 0;
  let time = 0;
  service.onTimeUpdate = value => { time = value; };
  service.audio.currentTime = 9;
  service.audio.dispatchEvent(new Event('timeupdate'));
  assert.equal(time, 9);
  delete globalThis.requestAnimationFrame;
  service.destroy();
});

test('simultaneous resume commands share one play promise and preserve position', async () => {
  const service = new AudioService();
  service.playlist = [{ surah: 1, ayah: 1, url }];
  await service.loadAndPlay(0);
  service.pause();
  service.audio.currentTime = 9;
  let calls = 0;
  const play = service.audio.play.bind(service.audio);
  service.audio.play = () => { calls++; return play(); };
  await Promise.all([service.resume(), service.resume()]);
  assert.equal(calls, 1);
  assert.equal(service.audio.currentTime, 9);
  assert.equal(service.state, 'PLAYING');
  service.destroy();
});

test('Media Session owns actions even with no UI, and mirrors a native interruption', async () => {
  const actions = new Map();
  const session = { setActionHandler: (name, handler) => actions.set(name, handler), setPositionState() {}, playbackState: 'none' };
  Object.defineProperty(navigator, 'mediaSession', { configurable: true, value: session });
  const service = new AudioService();
  service.playlist = [{ surah: 1, ayah: 1, url }];
  await service.loadAndPlay(0);
  service.audio.currentTime = 7;
  actions.get('pause')();
  assert.equal(service.state, 'PAUSED_BY_USER');
  assert.equal(session.playbackState, 'paused');
  await actions.get('play')();
  assert.equal(session.playbackState, 'playing');
  service.audio.pause();
  service.audio.dispatchEvent(new Event('pause'));
  assert.equal(session.playbackState, 'paused');
  assert.equal(service.audio.currentTime, 7);
  service.destroy();
  assert.equal(actions.get('play'), null);
  delete navigator.mediaSession;
});
