import React, { useEffect, useState } from "react";
import { t } from "../../i18n";
import { Icon } from "../ui/icon";
import { READER_LOAD } from "./readerLoadError.js";

/**
 * The reader's own answer to a data-load failure.
 *
 * One calm, readable surface per classified state, with only the actions that
 * can actually work in that state: an offline reader whose section was never
 * stored gets no retry loop (a reload of the same missing bytes is not a
 * recovery), while a timeout or a 5xx gets a real retry.
 */
const COPY = {
  [READER_LOAD.OFFLINE_NOT_STORED]: {
    title: "errors.notStoredTitle",
    body: "errors.notStoredBody",
    hint: "errors.notStoredHint",
    icon: "wifi-slash",
    homeOnly: true,
  },
  [READER_LOAD.TIMEOUT]: {
    title: "errors.loadError",
    body: "errors.loadNetwork",
    icon: "wifi-slash",
  },
  [READER_LOAD.NETWORK]: {
    title: "errors.loadError",
    body: "errors.loadNetwork",
    icon: "wifi-slash",
  },
  [READER_LOAD.SERVER]: {
    title: "errors.loadError",
    body: "errors.serverBody",
    icon: "circle-exclamation",
  },
  [READER_LOAD.EMPTY]: {
    title: "errors.loadError",
    body: "errors.emptyData",
    icon: "book-open",
  },
  [READER_LOAD.WARSH_TEXT]: {
    title: "errors.warshNotAvailable",
    body: "errors.loadNetwork",
    icon: "exclamation-triangle",
  },
};

function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine !== false,
  );
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const sync = () => setOnline(navigator.onLine !== false);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}

export default function ReaderDataState({
  code = READER_LOAD.EMPTY,
  dataSource,
  lang,
  onRetry,
  onBackHome,
  showSource = true,
}) {
  const online = useOnlineStatus();
  const copy = COPY[code] || COPY[READER_LOAD.EMPTY];
  // The offline hint promises a retry only once a connection is back, so the
  // button appears with the connection instead of failing again on tap.
  const offerRetry = !copy.homeOnly || online;

  return (
    <div
      className="reader-data-state mx-auto my-4 flex min-h-[18rem] max-w-xl flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center shadow-sm sm:min-h-[20rem] sm:p-8"
      role={copy.homeOnly && !online ? "status" : "alert"}
      aria-live={copy.homeOnly && !online ? "polite" : "assertive"}
    >
      <Icon name={copy.icon} size={30} className="mb-4 text-primary" />
      <p className="text-lg text-[var(--theme-text)] font-medium mb-2">
        {t(copy.title, lang)}
      </p>
      <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-[34rem] leading-relaxed">
        {t(copy.body, lang)}
      </p>
      <div className="reader-data-state__actions flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {offerRetry ? (
          <button
            className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:brightness-110 active:scale-95 transition-all shadow-lg"
            onClick={onRetry}
          >
            {t("errors.retry", lang)}
          </button>
        ) : null}
        <button
          className="px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--theme-text)] font-medium hover:bg-[var(--bg-tertiary)] active:scale-95 transition-all"
          onClick={onBackHome}
        >
          {t("errors.backHome", lang)}
        </button>
      </div>
      {copy.hint ? (
        <p className="mt-4 text-xs text-[var(--text-muted)]">{t(copy.hint, lang)}</p>
      ) : null}
      {showSource && !copy.homeOnly && dataSource?.label ? (
        <p className="reader-data-state__source">
          {t("errors.attemptedSource", lang)}: {dataSource.label}
        </p>
      ) : null}
    </div>
  );
}
