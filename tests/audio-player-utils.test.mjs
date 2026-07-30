import test from "node:test";
import assert from "node:assert/strict";

import { getAudioPlayerLabels } from "../src/components/audioPlayer/audioPlayerLabels.js";
import {
  clampCardPosition,
  formatAudioTime,
  getReciterCooldownMs,
} from "../src/components/audioPlayer/audioPlayerUtils.js";
import { createPausableAnimationLoop } from "../src/utils/pausableAnimationLoop.js";

test("audio utils: formats playback time safely", () => {
  assert.equal(formatAudioTime(undefined), "0:00");
  assert.equal(formatAudioTime(NaN), "0:00");
  assert.equal(formatAudioTime(-4), "0:00");
  assert.equal(formatAudioTime(0), "0:00");
  assert.equal(formatAudioTime(5.9), "0:05");
  assert.equal(formatAudioTime(65), "1:05");
  assert.equal(formatAudioTime(3605), "60:05");
});

test("audio utils: reciter cooldown grows within defined bounds", () => {
  assert.equal(getReciterCooldownMs(0), 30_000);
  assert.equal(getReciterCooldownMs(1), 30_000);
  assert.equal(getReciterCooldownMs(2), 8 * 60 * 1000);
  assert.equal(getReciterCooldownMs(99), 4 * 60 * 60 * 1000);
});

test("audio utils: clamps draggable player inside viewport", () => {
  assert.deepEqual(
    clampCardPosition(-40, -20, 320, 220, 12, { width: 1024, height: 768 }),
    { x: 12, y: 12 },
  );
  assert.deepEqual(
    clampCardPosition(980, 760, 320, 220, 12, { width: 1024, height: 768 }),
    { x: 692, y: 536 },
  );
  assert.deepEqual(
    clampCardPosition(300, 240, 420, 520, 12, { width: 360, height: 420 }),
    { x: 12, y: 12 },
  );
});

test("audio labels: core controls are available in every UI language", () => {
  for (const lang of ["fr", "en", "ar"]) {
    const labels = getAudioPlayerLabels(lang);
    for (const key of [
      "region",
      "search",
      "close",
      "play",
      "pause",
      "next",
      "previous",
      "modalTitle",
      "modalSubtitle",
    ]) {
      assert.equal(typeof labels[key], "string");
      assert.ok(labels[key].length > 0, `${lang}.${key} should not be empty`);
    }
  }
});

test("karaoke frame loop cancels all animation work while paused", () => {
  let nextFrameId = 0;
  const frames = new Map();
  const cancelled = [];
  let tickCount = 0;
  const loop = createPausableAnimationLoop(
    () => {
      tickCount += 1;
    },
    {
      requestFrame(callback) {
        const id = ++nextFrameId;
        frames.set(id, callback);
        return id;
      },
      cancelFrame(id) {
        cancelled.push(id);
        frames.delete(id);
      },
    },
  );

  loop.start();
  loop.start();
  assert.equal(frames.size, 1, "start should not create duplicate RAF callbacks");

  const [firstFrameId, firstFrame] = frames.entries().next().value;
  frames.delete(firstFrameId);
  firstFrame(16);
  assert.equal(tickCount, 1);
  assert.equal(frames.size, 1, "an active loop should schedule its next frame");

  const pendingFrameId = frames.keys().next().value;
  loop.stop();
  assert.equal(loop.active, false);
  assert.equal(frames.size, 0, "pause should leave no RAF callback pending");
  assert.deepEqual(cancelled, [pendingFrameId]);

  loop.start();
  assert.equal(frames.size, 1, "play should restart a stopped loop");
  loop.stop();
});
