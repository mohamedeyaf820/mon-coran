import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchTodayTimings,
  getNextPrayer,
  localDayKey,
  zoneOffsetFromDevice,
  zonedWallClock,
} from "../services/prayerTimesService";

/**
 * Owns the prayer-times fetch lifecycle for the home surface: cache-first
 * render, background refresh, auto-retry when the network comes back, and a
 * re-fetch at midnight so an app left open overnight rolls to the new day.
 */
export function usePrayerTimes({ enabled, location, method, offsets, now }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const dayKey = localDayKey(now);
  const locationReady = Boolean(location);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    if (!enabled || !location) return;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    try {
      const result = await fetchTodayTimings({
        latitude: location.latitude,
        longitude: location.longitude,
        method,
        offsets,
        date: new Date(),
      });
      if (requestRef.current !== requestId) return;
      setData(result);
      setError(null);
    } catch {
      if (requestRef.current !== requestId) return;
      setError(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [enabled, location, method, offsets]);

  useEffect(() => {
    if (!enabled || !locationReady) {
      setData(null);
      setError(null);
      return;
    }
    load();
  }, [enabled, locationReady, method, dayKey, load]);

  useEffect(() => {
    if (!enabled || !locationReady) return undefined;
    const retry = () => load();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [enabled, locationReady, load]);

  const status = !enabled
    ? "disabled"
    : !locationReady
      ? "no-location"
      : loading && !data
        ? "loading"
        : error && !data
          ? error
          : data
            ? "ready"
            : "loading";

  // The times are the location's wall times: judge "next" on its clock.
  const placeNow = status === "ready" ? zonedWallClock(now, data.timezone) : now;
  const next = status === "ready" ? getNextPrayer(data.timings, placeNow) : null;
  // Minutes the place's clock is ahead of the device's (0 for a reader on site).
  const offsetMinutes = status === "ready" ? zoneOffsetFromDevice(now, data.timezone) : 0;

  return { status, data, error, next, placeNow, offsetMinutes, refresh: load, loading };
}
