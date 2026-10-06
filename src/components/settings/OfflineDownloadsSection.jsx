import { offlineText } from "../../i18n/offline.js";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { getSurah } from "../../data/surahs";
import { getReciter } from "../../data/reciters";
import { Section } from "./controls";
import { Button } from "../ui/button";
import { confirmAction } from "../../services/interactionService";
import { getStorageSnapshot } from "../../services/storageQuotaService";
import {
  getVerifiedOfflineAudioEntries, getCacheSize, removeSurahCacheForReciter,
  clearAllOfflineAudio, OFFLINE_DOWNLOADS_CHANGED_EVENT,
} from "../../services/downloadService";

export default function OfflineDownloadsSection({ lang }) {
  const [entries, setEntries] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [size, setSize] = useState(0);
  const [persisted, setPersisted] = useState(false);
  const [storage, setStorage] = useState(null);
  const pending = useRef(false);
  const mounted = useRef(false);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(false);
    try {
      const [next, megabytes, storage] = await Promise.all([
        getVerifiedOfflineAudioEntries(), getCacheSize(), getStorageSnapshot(),
      ]);
      if (mounted.current) { setEntries(next); setSize(megabytes); setPersisted(storage.persisted); setStorage(storage); }
    } catch { if (mounted.current) setError(true); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const connection = () => { setOnline(navigator.onLine); void refresh(); };
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    window.addEventListener(OFFLINE_DOWNLOADS_CHANGED_EVENT, refresh);
    return () => {
      mounted.current = false;
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener(OFFLINE_DOWNLOADS_CHANGED_EVENT, refresh);
    };
  }, [refresh]);
  const remove = async (entry) => {
    if (pending.current) return;
    if (!entry && !(await confirmAction({ message: offlineText("confirm", lang), tone: "danger" }))) return;
    pending.current = true;
    setBusy(true);
    let failed = false;
    try {
      if (entry) {
        const reciter = getReciter(entry.reciterId, entry.riwaya) || { id: entry.reciterId, cdn: entry.reciterCdn, cdnType: entry.cdnType };
        await removeSurahCacheForReciter({ surahMeta: getSurah(entry.surahNum), reciter, riwaya: entry.riwaya });
      } else await clearAllOfflineAudio();
    } catch { failed = true; }
    finally { pending.current = false; await refresh(); if (failed && mounted.current) setError(true); }
  };
  return <Section title={offlineText("title", lang)}>
    <div className="settings-panel-stack" data-testid="offline-downloads" aria-busy={busy}>
      <p role="status">{offlineText(online ? "online" : "offline", lang)} · {offlineText("used", lang)}: <bdi>{size.toLocaleString(lang)} MB</bdi></p>
      {storage?.supported && <p>{offlineText("storage", lang)}: <bdi>{(storage.usage / 1048576).toLocaleString(lang, { maximumFractionDigits: 1 })} / {(storage.quota / 1048576).toLocaleString(lang, { maximumFractionDigits: 1 })} MB</bdi></p>}
      <p className="settings-cache-note">{offlineText(persisted ? "persistent" : "eviction", lang)}</p>
      {busy && <p role="status">{offlineText("checking", lang)}</p>}
      {error && <p role="alert">{offlineText("error", lang)}</p>}
      {!busy && !entries.length && <p>{offlineText("empty", lang)}</p>}
      {entries.map(entry => {
        const surah = getSurah(entry.surahNum);
        const name = lang === "ar" ? surah?.ar : lang === "en" ? surah?.en : surah?.fr;
        return <div key={entry.key} className="settings-panel-stack">
          <strong>{name || entry.surahNum}</strong>
          <span>{entry.reciterName || entry.reciterId} · <bdi>{entry.riwaya === "warsh" ? "Warsh" : "Hafs"}</bdi></span>
          <span>{offlineText(!entry.verified ? "unverified" : entry.status === "done" ? "done" : "partial", lang)}</span>
          <span><bdi>{entry.downloaded || 0}/{entry.total || 0}</bdi> {offlineText("files", lang)} · <bdi>{((entry.bytes || 0) / 1048576).toLocaleString(lang, { maximumFractionDigits: 2 })} MB</bdi></span>
          <Button type="button" className="min-h-11 whitespace-normal" variant="outline" disabled={busy || (!entry.reciterCdn && !getReciter(entry.reciterId, entry.riwaya))} onClick={() => remove(entry)} aria-label={`${offlineText("remove", lang)} ${name || entry.surahNum} — ${entry.reciterName || entry.reciterId}`}>
            <Trash2 size={16} aria-hidden="true" />{offlineText("remove", lang)}
          </Button>
        </div>;
      })}
      {entries.length > 0 && <Button type="button" className="min-h-11 whitespace-normal" variant="destructive" disabled={busy} onClick={() => remove(null)}>{offlineText("removeAll", lang)}</Button>}
      <Button type="button" className="min-h-11 whitespace-normal" variant="outline" disabled={busy} onClick={refresh}>{offlineText("retry", lang)}</Button>
    </div>
  </Section>;
}
