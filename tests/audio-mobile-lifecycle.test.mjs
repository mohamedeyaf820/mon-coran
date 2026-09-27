import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

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

test('an online hidden advance retries on its own without the foreground', async () => {
  const service = new AudioService();
  const urls = [1, 2].map((n) => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, number: i + 1, url }));
  await service.loadAndPlay(0);

  // Background the app while online and let the next verse's play fail.
  document.visibilityState = 'hidden';
  document.hidden = true;
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  const workingPlay = service.audio.play.bind(service.audio);
  service.audio.play = () => {
    service.audio.paused = true;
    return Promise.reject(new DOMException('Background suspension', 'NotSupportedError'));
  };
  await service.loadAndPlay(1);
  assert.equal(service.isPlaying, false, 'the failed hidden advance is parked');
  assert.equal(service._pendingBackgroundIndex, 1);
  assert.notEqual(service._backgroundRetryTimer, null, 'a timer retry is scheduled while still hidden');

  // Restore the capability; the scheduled timer must recover the queue on its
  // own — waiting for the foreground is what stalled Android recitation.
  service.audio.play = workingPlay;
  await new Promise((resolve) => setTimeout(resolve, 1400));
  assert.equal(document.hidden, true, 'recovered without returning to the foreground');
  assert.equal(service.audio.src, urls[1]);
  assert.equal(service.isPlaying, true);
  assert.equal(service._pendingBackgroundIndex, null);
  assert.equal(service._backgroundRetryTimer, null);

  document.visibilityState = 'visible';
  document.hidden = false;
  delete navigator.onLine;
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

test('a native error during a hidden verse retries the same reciter and position', async () => {
  const service = new AudioService();
  const url = 'https://audio.qurancdn.com/Alafasy/mp3/001001.mp3';
  service.playlist = [{ surah: 1, ayah: 1, url }];
  await service.loadAndPlay(0);
  service.audio.currentTime = 12;
  document.visibilityState = 'hidden';
  document.hidden = true;
  let reported = 0;
  service.onError = () => { reported++; };
  service.audio.dispatchEvent(new Event('error'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.audio.src, url);
  assert.equal(service.audio.currentTime, 12);
  assert.equal(service.isPlaying, true);
  assert.equal(reported, 0, 'a transient hidden error must not switch reciters');
  document.visibilityState = 'visible';
  document.hidden = false;
  service.destroy();
});

test('lock-screen play retries the pending verse rather than an ended file', async () => {
  const service = new AudioService();
  const urls = [1, 2].map((n) => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, url }));
  await service.loadAndPlay(0);
  service._pendingBackgroundIndex = 1;
  service.audio.pause();
  await service.resume();
  assert.equal(service.audio.src, urls[1]);
  assert.equal(service.isPlaying, true);
  service.destroy();
});

test('a load error is handled by its retry path only', async () => {
  const service = new AudioService();
  const url = 'https://audio.qurancdn.com/Alafasy/mp3/001001.mp3';
  service.playlist = [{ surah: 1, ayah: 1, url }];
  let reported = 0;
  service.onError = () => { reported++; };
  const loading = service.loadAndPlay(0);
  service.audio.dispatchEvent(new Event('error'));
  await loading;
  assert.equal(reported, 0);
  service.destroy();
});

test('a hidden Warsh interruption retries its pending verse when network returns', async () => {
  const service = new AudioService();
  const url = 'https://files.quranpedia.net/recitations/267/001001.mp3';
  service.playlist = [{ surah: 1, ayah: 1, url }];
  await service.loadAndPlay(0);
  document.visibilityState = 'hidden';
  document.hidden = true;
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  let reported = 0;
  service.onError = () => { reported++; };
  service.audio.dispatchEvent(new Event('error'));
  assert.equal(service._pendingBackgroundIndex, 0);
  assert.equal(reported, 0);
  delete navigator.onLine;
  service._boundOnline();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.audio.src, url);
  assert.equal(service.isPlaying, true);
  assert.equal(service._pendingBackgroundIndex, null);
  document.visibilityState = 'visible';
  document.hidden = false;
  service.destroy();
});
test('the verse after ended starts inside the same task, before anything awaits', async () => {
  const service = new AudioService();
  const urls = [1, 2].map((n) => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, number: i + 1, url }));
  await service.loadAndPlay(0);

  // Mobile behaviour: the element only honours a `play()` issued from the
  // `ended` task itself. Android refuses it once the page is hidden, iOS/PWA
  // drops it after any `await` (WebKit 261858).
  let endedTaskAlive = false;
  let playCalls = 0;
  const nativePlay = service.audio.play.bind(service.audio);
  service.audio.play = () => {
    playCalls += 1;
    if (!endedTaskAlive) {
      service.audio.paused = true;
      return Promise.reject(new DOMException('User activation required', 'NotAllowedError'));
    }
    return nativePlay();
  };

  document.visibilityState = 'hidden';
  document.hidden = true;
  endedTaskAlive = true;
  service.audio.dispatchEvent(new Event('ended'));
  endedTaskAlive = false;

  assert.equal(service.audio.src, urls[1], 'the next source is selected synchronously');
  assert.equal(service.audio.paused, false, 'and plays before the task yields');
  assert.equal(service.playlistIndex, 1);
  assert.equal(service.isPlaying, true);

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(playCalls, 1, 'nothing replayed the verse after the task ended');
  assert.equal(service.audio.src, urls[1]);

  document.visibilityState = 'visible';
  document.hidden = false;
  service.destroy();
});

test('a hidden advance failure keeps the lock-screen session playing', async () => {
  const service = new AudioService();
  const urls = [1, 2].map((n) => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, number: i + 1, url }));
  await service.loadAndPlay(0);

  let pauses = 0;
  let plays = 0;
  service.onPause = () => { pauses += 1; };
  service.onPlay = () => { plays += 1; };

  document.visibilityState = 'hidden';
  document.hidden = true;
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  const workingPlay = service.audio.play.bind(service.audio);
  service.audio.play = () => {
    service.audio.paused = true;
    return Promise.reject(new DOMException('User activation required', 'NotAllowedError'));
  };

  service.audio.dispatchEvent(new Event('ended'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.isPlaying, false, 'the element really is stopped');
  assert.equal(pauses, 0, 'announcing a pause would release Android audio focus');
  assert.equal(service._pendingBackgroundIndex, 1);
  assert.notEqual(service._backgroundRetryTimer, null);

  service.audio.play = workingPlay;
  await new Promise((resolve) => setTimeout(resolve, 1400));
  assert.equal(service.audio.src, urls[1]);
  assert.equal(service.isPlaying, true);
  assert.equal(service._pendingBackgroundIndex, null);
  assert.equal(pauses, 0, 'the session never read `paused` to the OS');
  assert.ok(plays >= 1, 'the running verse was announced');

  document.visibilityState = 'visible';
  document.hidden = false;
  delete navigator.onLine;
  service.destroy();
});

test('lock-screen Play spends the gesture on a synchronous hand-off', async () => {
  const service = new AudioService();
  const urls = [1, 2].map((n) => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, number: i + 1, url }));
  await service.loadAndPlay(0);
  service._pendingBackgroundIndex = 1;
  service.audio.pause();

  let loadChainCalls = 0;
  const nativeLoad = service._loadUrlWithRetry.bind(service);
  service._loadUrlWithRetry = (...args) => {
    loadChainCalls += 1;
    return nativeLoad(...args);
  };

  await service.resume();
  assert.equal(service.audio.src, urls[1]);
  assert.equal(service.isPlaying, true);
  assert.equal(loadChainCalls, 0, 'the awaited load chain would lose the activation');
  service.destroy();
});

test('one verse stays warm while hidden so the hand-off has data', async () => {
  const service = new AudioService();
  const urls = [1, 2, 3].map((n) => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, number: i + 1, url }));

  document.visibilityState = 'hidden';
  document.hidden = true;
  service._preloadAhead(0, 3);
  assert.equal(service._maxPreloadPool, 1, 'hidden preloading must not starve the live verse');
  assert.equal(service._preloadPool.length, 1);
  assert.equal(service._preloadPool[0].url, urls[0]);

  document.visibilityState = 'visible';
  document.hidden = false;
  service.destroy();
});

test('the pause an engine reports while swapping the source is not the reader pausing', async () => {
  const service = new AudioService();
  const urls = [1, 2].map((n) => `https://audio.qurancdn.com/Alafasy/mp3/00100${n}.mp3`);
  service.playlist = urls.map((url, i) => ({ surah: 1, ayah: i + 1, number: i + 1, url }));
  await service.loadAndPlay(0);

  let pauses = 0;
  service.onPause = () => { pauses += 1; };
  // Some engines report the resource they are leaving as paused when the
  // source is swapped. That event is queued, so it lands after the hand-off.
  const element = service.audio;
  const nativeLoad = element.load.bind(element);
  element.load = () => {
    nativeLoad();
    setTimeout(() => element.dispatchEvent(new Event('pause')), 0);
  };

  service.audio.dispatchEvent(new Event('ended'));
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(service.audio.src, urls[1]);
  assert.equal(service.isPlaying, true, 'the recitation is still meant to run');
  assert.equal(pauses, 0, 'a transition pause never reaches the lock screen');

  // Once the new verse really plays, a genuine pause is reported again.
  service.audio.dispatchEvent(new Event('playing'));
  service.audio.dispatchEvent(new Event('pause'));
  assert.equal(pauses, 1);
  assert.equal(service.isPlaying, false);
  service.destroy();
});

test('the verse-boundary hand-off never awaits before it plays', () => {
  // The `ended` event grants an activation that a single `await` spends: the
  // deferred `play()` is then refused on a hidden page (Android background
  // suspension, iOS WebKit 261858), which is the bug this module prevents.
  // Keep the swap awaited-free and keep the service delegating to it.
  const source = readFileSync('src/services/audioHandoff.js', 'utf8');
  const start = source.indexOf('export function handOffToIndex');
  const end = source.indexOf('export function handleVerseEnded');
  assert.ok(start > 0 && end > start, 'the module exposes both entry points');
  const swap = source.slice(start, end);
  const playAt = swap.indexOf('svc.audio.play()');
  assert.ok(playAt > 0, 'the hand-off starts the next verse itself');
  assert.equal(
    /await\s/.test(swap.slice(0, playAt)),
    false,
    'an await before play() spends the activation the ended event granted',
  );

  const service = readFileSync('src/services/audioService.js', 'utf8');
  assert.match(service, /handleVerseEnded\(this\)/);
  assert.match(service, /return handOffToIndex\(this, index\)/);
});
