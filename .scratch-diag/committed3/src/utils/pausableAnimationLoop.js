export function createPausableAnimationLoop(
  callback,
  {
    requestFrame = globalThis.requestAnimationFrame,
    cancelFrame = globalThis.cancelAnimationFrame,
  } = {},
) {
  if (typeof callback !== "function") {
    throw new TypeError("A frame callback is required");
  }
  if (typeof requestFrame !== "function" || typeof cancelFrame !== "function") {
    throw new TypeError("Animation frame functions are required");
  }

  let active = false;
  let frameId = null;

  const schedule = () => {
    if (!active || frameId !== null) return;
    frameId = requestFrame(runFrame);
  };

  const runFrame = (timestamp) => {
    frameId = null;
    if (!active) return;
    callback(timestamp);
    schedule();
  };

  return {
    start() {
      if (active) return;
      active = true;
      schedule();
    },
    stop() {
      active = false;
      if (frameId !== null) {
        cancelFrame(frameId);
        frameId = null;
      }
    },
    get active() {
      return active;
    },
  };
}
