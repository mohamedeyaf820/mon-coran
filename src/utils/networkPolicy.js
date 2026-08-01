function resolveNavigator(value) {
  if (value) return value;
  return typeof navigator !== "undefined" ? navigator : null;
}

function resolveWindow(value) {
  if (value) return value;
  return typeof window !== "undefined" ? window : null;
}

export function getNetworkProfile(navigatorObject) {
  const nav = resolveNavigator(navigatorObject);
  const connection =
    nav?.connection || nav?.mozConnection || nav?.webkitConnection || null;
  const effectiveType = String(connection?.effectiveType || "").toLowerCase();
  const downlink = Number(connection?.downlink);

  return {
    online: nav?.onLine !== false,
    saveData: connection?.saveData === true,
    effectiveType,
    downlink: Number.isFinite(downlink) ? downlink : null,
    deviceMemory:
      typeof nav?.deviceMemory === "number" ? nav.deviceMemory : null,
    hardwareConcurrency:
      typeof nav?.hardwareConcurrency === "number"
        ? nav.hardwareConcurrency
        : null,
  };
}

export function shouldAvoidBackgroundWork(navigatorObject) {
  const profile = getNetworkProfile(navigatorObject);
  return (
    !profile.online ||
    profile.saveData ||
    /slow-2g|2g|3g/.test(profile.effectiveType) ||
    (profile.downlink !== null && profile.downlink < 1.5)
  );
}

export function getAdaptiveAudioPreloadCount(navigatorObject) {
  const profile = getNetworkProfile(navigatorObject);
  if (
    !profile.online ||
    profile.saveData ||
    /slow-2g|2g/.test(profile.effectiveType)
  ) {
    return 0;
  }
  if (
    profile.effectiveType === "3g" ||
    (profile.downlink !== null && profile.downlink < 2) ||
    (profile.deviceMemory !== null && profile.deviceMemory <= 2)
  ) {
    return 1;
  }
  if (
    profile.effectiveType === "4g" &&
    (profile.downlink === null || profile.downlink >= 5) &&
    (profile.deviceMemory === null || profile.deviceMemory >= 4)
  ) {
    return 3;
  }
  return 2;
}

export function isLowPerformanceDevice({
  navigatorObject,
  windowObject,
} = {}) {
  const profile = getNetworkProfile(navigatorObject);
  const currentWindow = resolveWindow(windowObject);
  const reducedMotion = currentWindow?.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  const lowMemory =
    profile.deviceMemory !== null && profile.deviceMemory <= 4;
  const lowCpu =
    profile.hardwareConcurrency !== null && profile.hardwareConcurrency <= 4;
  const constrainedNetwork =
    profile.saveData || /slow-2g|2g/.test(profile.effectiveType);
  const constrainedMobile =
    currentWindow?.matchMedia?.("(max-width: 820px)")?.matches &&
    (lowMemory || lowCpu || /slow-2g|2g|3g/.test(profile.effectiveType));

  return Boolean(
    reducedMotion ||
      lowMemory ||
      lowCpu ||
      constrainedNetwork ||
      constrainedMobile,
  );
}
