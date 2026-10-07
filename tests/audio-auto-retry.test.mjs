import assert from "node:assert/strict";
import test from "node:test";

import { armAutoRetry, cancelAutoRetry } from "../src/services/audioAutoRetry.js";

function engine(overrides = {}) {
  const calls = [];
  return {
    calls,
    _commandId: 7,
    _playbackIntent: "playing",
    _autoRetryCount: 0,
    _autoRetryCancel: null,
    isPlaying: false,
    _diagnose() {},
    _loadAndPlay(index, options) {
      calls.push({ index, options });
      return Promise.resolve();
    },
    ...overrides,
  };
}

function withNetwork(onLine, run) {
  const previousWindow = globalThis.window;
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const target = new EventTarget();
  globalThis.window = {
    addEventListener: (type, fn, opts) => target.addEventListener(type, fn, opts),
    removeEventListener: (type, fn) => target.removeEventListener(type, fn),
    setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 5)),
    clearTimeout,
  };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { onLine } });
  const restore = () => {
    globalThis.window = previousWindow;
    if (descriptor) Object.defineProperty(globalThis, "navigator", descriptor);
    else delete globalThis.navigator;
  };
  return Promise.resolve(run(target)).finally(restore);
}

test("a verse that failed offline is retried once when the network is back", () =>
  withNetwork(false, (network) => {
    const svc = engine();
    armAutoRetry(svc, 3, 1.5, 7, new Error("offline"));
    assert.equal(svc.calls.length, 0, "nothing is retried while offline");
    network.dispatchEvent(new Event("online"));
    network.dispatchEvent(new Event("online"));
    assert.deepEqual(svc.calls, [{ index: 3, options: { position: 1.5 } }]);
    assert.equal(svc._autoRetryCount, 1);
  }));

test("a command of the reader supersedes the recovery", () =>
  withNetwork(false, (network) => {
    const svc = engine();
    armAutoRetry(svc, 3, 0, 7, new Error("offline"));
    svc._commandId = 8; // pause, stop or another verse
    network.dispatchEvent(new Event("online"));
    assert.equal(svc.calls.length, 0);
  }));

test("a paused or stopped recitation is never resumed by itself", () =>
  withNetwork(false, (network) => {
    const svc = engine({ _playbackIntent: "paused" });
    armAutoRetry(svc, 3, 0, 7, new Error("offline"));
    network.dispatchEvent(new Event("online"));
    assert.equal(svc.calls.length, 0);
  }));

test("an autoplay refusal is not a network failure and is not retried", () =>
  withNetwork(true, async () => {
    const svc = engine();
    armAutoRetry(svc, 3, 0, 7, Object.assign(new Error("blocked"), { name: "NotAllowedError" }));
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(svc.calls.length, 0);
  }));

test("online failures are retried twice at most", () =>
  withNetwork(true, async () => {
    const svc = engine();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      armAutoRetry(svc, 2, 0, 7, new Error("500"));
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    assert.equal(svc.calls.length, 2);
    cancelAutoRetry(svc);
  }));
