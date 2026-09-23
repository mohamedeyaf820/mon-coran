import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const bootSource = readFileSync(new URL('../public/boot-recovery.js', import.meta.url), 'utf8');
const workerSource = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

test('online audio still streams when Cache Storage is unavailable', async () => {
  const context = {
    Response, self: { addEventListener: () => {} },
    caches: { open: async () => { throw new Error('Storage denied'); } },
    fetch: async () => new Response('audio'),
  };
  vm.runInNewContext(workerSource, context);
  const response = await context.audioCacheFirst(new Request('https://everyayah.com/data/test/001001.mp3'));
  assert.equal(await response.text(), 'audio');
});

for (const [range, status, body, contentRange] of [
  ['bytes=0-999', 206, '0123456789', 'bytes 0-9/10'],
  ['bytes=-3', 206, '789', 'bytes 7-9/10'],
  ['bytes=4-', 206, '456789', 'bytes 4-9/10'],
  ['bytes=20-', 416, '', 'bytes */10'],
  ['bytes=invalid', 200, '0123456789', null],
  ['bytes=0-1,4-5', 200, '0123456789', null],
]) {
  test(`offline audio serves a usable body for ${range}`, async () => {
    const context = { Response, self: { addEventListener: () => {} } };
    vm.runInNewContext(workerSource, context);
    const result = await context.createPartialResponse(new Response('0123456789'), range);
    assert.equal(result.status, status);
    assert.equal(result.headers.get('Content-Range'), contentRange);
    assert.equal(await result.text(), body);
  });
}

for (const online of [false, true]) {
  test(`boot recovery preserves cached data when network is unavailable (online hint: ${online})`, async () => {
    const handlers = {};
    let deletions = 0;
    let reloads = 0;
    const context = {
      navigator: { onLine: online },
      document: { getElementById: () => null },
      window: { addEventListener: (name, callback) => { handlers[name] = callback; }, location: { reload: () => { reloads++; } } },
      sessionStorage: { getItem: () => null, setItem: () => {} },
      caches: { keys: async () => ['mushaf-plus-v21'], delete: async () => { deletions++; } },
      fetch: async (_url, options) => {
        assert.equal(options.method, 'HEAD', 'connectivity probe must bypass the GET-only service worker');
        throw new TypeError('Network unavailable');
      },
      setTimeout: () => {},
    };
    vm.runInNewContext(bootSource, context);
    handlers.error({ target: { src: 'https://qa.test/assets/unavailable.js' } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(deletions, 0);
    assert.equal(reloads, 0);
  });
}

for (const [url, cacheName, ignoreVary] of [
  ['https://qa.test/assets/app.js', 'mushaf-plus-v21', true],
  ['https://api.alquran.cloud/v1/surah/1', 'mushaf-plus-api-v6', false],
]) {
  test(`worker uses the correct Vary policy for ${url}`, async () => {
    const calls = [];
    const cached = new Response('cached content');
    const context = {
      URL, Response,
      self: { location: { origin: 'https://qa.test' }, addEventListener: () => {} },
      caches: { open: async () => ({ match: async (_request, options) => { calls.push(options.ignoreVary); return cached; } }) },
    };
    vm.runInNewContext(workerSource, context);
    const response = await context.cacheFirst(new Request(url), cacheName);
    assert.equal(await response.text(), 'cached content');
    assert.deepEqual(calls, [ignoreVary]);
  });
}

test('worker and downloader open the same offline audio cache', () => {
  const downloadSource = readFileSync(
    new URL('../src/services/downloadService.js', import.meta.url),
    'utf8',
  );
  const workerCache = /const AUDIO_CACHE_NAME = "([^"]+)"/.exec(workerSource)?.[1];
  const serviceCache = /export const OFFLINE_AUDIO_CACHE_NAME = "([^"]+)"/.exec(
    downloadSource,
  )?.[1];
  // A mismatch is silent: downloads succeed and the player still streams.
  assert.equal(workerCache, serviceCache);
});

test('trim keeps the precached shell and evicts the oldest runtime entries', async () => {
  const keys = [
    '/manifest.json',
    '/fonts/uthmanic-hafs-v18.woff2',
    '/assets/late-chunk.js',
    '/icons/icon-192.png',
    '/index.html',
  ].map((path) => ({ request: { url: `https://qa.test${path}` } }));
  const deleted = [];
  const context = {
    URL, Response,
    self: { location: { origin: 'https://qa.test' }, addEventListener: () => {} },
    caches: { open: async () => ({}) },
  };
  vm.runInNewContext(workerSource, context);
  await context.trimCache(
    { keys: async () => keys, delete: async (key) => deleted.push(new URL(key.request.url).pathname) },
    3,
  );
  assert.deepEqual(deleted, ['/assets/late-chunk.js', '/icons/icon-192.png']);
});
