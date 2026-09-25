import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTodayTimings, getNextPrayer } from "../services/prayerTimesService";

function dayKeyOf(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Owns the prayer-times fetch lifecycle for the home surface: cache-first
 * render, background refresh, auto-retry when the network comes back, and a
 * re-fetch at midnight so an app left open overnight rolls to the new day.
 */
export function usePrayerTimes({ enabled, location, method, now }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const dayKey = dayKeyOf(now);
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
  }, [enabled, location, method]);

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

  const next = status === "ready" ? getNextPrayer(data.timings, now) : null;

  return { status, data, error, next, refresh: load, loading };
}
