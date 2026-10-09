import assert from 'node:assert/strict';
import test from 'node:test';
import { getEventListeners } from 'node:events';
import { fetchWithTimeout } from '../src/services/fetchWithTimeout.js';
import { bookmarkRecordSchema, noteRecordSchema } from '../src/services/storageValidation.js';

for (const [name, schema, fields] of [
  ['note', noteRecordSchema, { text: 'QA', updatedAt: 1 }],
  ['bookmark', bookmarkRecordSchema, { label: 'QA', createdAt: 1 }],
]) {
  test(`${name}: rejects a record whose key points to another verse`, () => {
    assert.equal(schema.safeParse({ id: '1:1', surah: 2, ayah: 255, ...fields }).success, false);
  });
}

test('fetch timeout: an already cancelled navigation never sends a request', async (t) => {
  const controller = new AbortController();
  controller.abort();
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return new Response('ok'); });
  await assert.rejects(fetchWithTimeout('https://example.test', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(requests, 0);
});

test('fetch timeout: caller cancellation retains AbortError', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const pending = fetchWithTimeout('https://example.test', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('fetch timeout: finished requests release their cancellation listeners', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => new Response('ok'));
  await fetchWithTimeout('https://example.test', { signal: controller.signal });
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('fetch timeout: actual timeout is still reported', async (t) => {
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  await assert.rejects(fetchWithTimeout('https://example.test', {}, 10), /timed out/);
});
