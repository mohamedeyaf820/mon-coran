import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { t } from "../../i18n";
import { PRAYER_CITIES } from "../../data/prayerCities";
import { requestLocation } from "../../services/prayerTimesService";
import { suggestPrayerMethod } from "../../data/prayerRegions";

const fold = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Shown before the reader types: the cities most readers of the app live in,
// so the common case is one tap without scrolling a list of thirty.
const POPULAR_CITY_IDS = new Set(["paris", "marseille", "lyon", "bruxelles", "casablanca", "alger", "tunis", "mecque"]);

const cityName = (city, lang) => (lang === "ar" ? city.ar : lang === "en" ? city.en : city.fr);

/**
 * The one place a reader says where they are. Two ways, both one tap away:
 * the device position, or a city from a short offline list (no geocoding
 * request, so it works without a network and tells no third party a city
 * name). Replaces the old detour through Settings > Prayer.
 */
export default function PrayerLocationPicker({ lang, set, onDone, currentLabel = "", methodAuto = true, autoDetect = false }) {
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const autoTried = useRef(false);
  const busy = useRef(false);
  const searchId = useId();
  const statusId = useId();

  const cities = useMemo(() => {
    const needle = fold(query);
    const list = PRAYER_CITIES.filter((city) =>
      needle
        ? [city.fr, city.en, city.ar].some((name) => fold(name).includes(needle))
        : showAll || POPULAR_CITY_IDS.has(city.id) || fold(city[lang] || city.fr) === fold(currentLabel),
    );
    return [...list].sort((a, b) => cityName(a, lang).localeCompare(cityName(b, lang), lang));
  }, [query, lang, showAll, currentLabel]);

  const detect = useCallback(async () => {
    // A tap and the browser's "allowed" signal can arrive together: one request.
    if (busy.current) return;
    busy.current = true;
    setLocating(true);
    setError("");
    try {
      const position = await requestLocation();
      set({
        prayerTimesEnabled: true,
        prayerLocation: { latitude: position.latitude, longitude: position.longitude, label: "" },
        // The method of the reader's region, unless they chose one themselves.
        ...(methodAuto ? { prayerMethod: suggestPrayerMethod(position.latitude, position.longitude) } : {}),
      });
      onDone?.();
    } catch (failure) {
      setError(
        failure?.code === 1
          ? t("prayer.locationDenied", lang)
          : failure?.code === "unsupported"
            ? t("prayer.locationUnsupported", lang)
            : t("prayer.locationError", lang),
      );
    } finally {
      busy.current = false;
      setLocating(false);
    }
  }, [lang, methodAuto, onDone, set]);

  const choose = useCallback(
    (city) => {
      set({
        prayerTimesEnabled: true,
        prayerLocation: { latitude: city.latitude, longitude: city.longitude, label: cityName(city, lang) },
        ...(methodAuto ? { prayerMethod: suggestPrayerMethod(city.latitude, city.longitude) } : {}),
      });
      onDone?.();
    },
    [lang, methodAuto, onDone, set],
  );

  // When the browser already allows the position, the first visit needs no tap
  // at all; when it is blocked, say so up front instead of failing on a tap.
  useEffect(() => {
    let cancelled = false;
    let status = null;
    const sync = () => {
      if (cancelled || !status) return;
      setBlocked(status.state === "denied");
      if (autoDetect && status.state === "granted" && !autoTried.current) {
        autoTried.current = true;
        detect();
      }
    };
    try {
      navigator.permissions
        ?.query({ name: "geolocation" })
        .then((result) => {
          status = result;
          status.onchange = sync;
          sync();
        })
        .catch(() => {});
    } catch {
      // Permissions API unavailable: the tap path still works.
    }
    return () => {
      cancelled = true;
      if (status) status.onchange = null;
    };
  }, [autoDetect, detect]);

  return (
    <div className="prayers-picker">
      <button type="button" className="prayers-picker__locate" onClick={detect} disabled={locating}>
        {locating ? (
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed size={18} aria-hidden="true" />
        )}
        <span>{locating ? t("prayer.detecting", lang) : t("prayers.useMyPosition", lang)}</span>
      </button>
      <p className="prayers-picker__privacy">
        {blocked ? t("prayers.positionBlocked", lang) : t("prayers.positionPrivacy", lang)}
      </p>
      {error ? (
        <p className="prayers-picker__error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="prayers-picker__or">
        <span>{t("prayers.orChooseCity", lang)}</span>
      </p>

      <label className="prayers-picker__search" htmlFor={searchId}>
        <Search size={16} aria-hidden="true" />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("prayers.searchCity", lang)}
          placeholder={t("prayers.searchCity", lang)}
          aria-describedby={statusId}
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
      <p id={statusId} className="sr-only" role="status">
        {cities.length ? "" : t("prayers.noCityFound", lang)}
      </p>

      {cities.length ? (
        <ul className="prayers-picker__cities" aria-label={t("prayers.cityListAria", lang)}>
          {cities.map((city) => {
            const name = cityName(city, lang);
            return (
              <li key={city.id}>
                <button
                  type="button"
                  className={`prayers-picker__city${name === currentLabel ? " is-current" : ""}`}
                  aria-current={name === currentLabel ? "true" : undefined}
                  onClick={() => choose(city)}
                >
                  <MapPin size={15} aria-hidden="true" />
                  <span>{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="prayers-picker__none">{t("prayers.noCityFound", lang)}</p>
      )}
      {!query.trim() && !showAll ? (
        <button type="button" className="prayers-picker__all" onClick={() => setShowAll(true)}>
          {t("prayers.allCities", lang)}
        </button>
      ) : null}
    </div>
  );
}
