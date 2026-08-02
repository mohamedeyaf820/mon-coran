import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpenText,
  Brain,
  Cloud,
  Download,
  FileDown,
  HardDrive,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  WifiOff,
} from "lucide-react";
import { useAppActions, useAppSelector } from "../context/AppContext";
import SURAHS, { getSurah, surahName } from "../data/surahs";
import { THEMATIC_INDEX, thematicLabel } from "../data/thematicIndex";
import { getReciter } from "../data/reciters";
import {
  OFFLINE_DOWNLOADS_CHANGED_EVENT,
  cancelOfflineDownload,
  clearAllOfflineAudio,
  downloadSurahForReciter,
  getCacheSize,
  getOfflineAudioEntries,
  removeSurahCacheForReciter,
} from "../services/downloadService";
import {
  downloadDiagnostics,
  downloadCollections,
  importFromFile,
  shareCollections,
} from "../services/exportService";
import {
  MEMORIZATION_PLAN_CHANGED_EVENT,
  MEMORIZATION_PRESETS,
  clearMemorizationPlan,
  getMemorizationPlan,
  getMemorizationPlanSummary,
  getMemorizationPresetMeta,
  getPlanSurahs,
  getTodayMemorizationQueue,
  saveMemorizationPlan,
} from "../services/memorizationPlanService";
import { toast } from "../lib/utils";
import { confirmAction } from "../services/interactionService";
import { getStorageSnapshot } from "../services/storageQuotaService";
import FutureFeaturesHeader from "./futureFeatures/FutureFeaturesHeader";

const TAB_IDS = ["offline", "export", "memorization", "themes", "cloud"];

function localText(lang, fr, en, ar) {
  if (lang === "ar") return ar || en || fr;
  if (lang === "en") return en || fr;
  return fr;
}

function formatMegabytes(value, lang) {
  return `${Number(value || 0).toLocaleString(lang === "ar" ? "ar" : lang, {
    maximumFractionDigits: 1,
  })} Mo`;
}

function formatStorageBytes(value, lang) {
  if (!Number.isFinite(value)) return "—";
  return formatMegabytes(value / 1_048_576, lang);
}

function OfflinePanel({ lang, currentSurah, reciterId, riwaya }) {
  const [entries, setEntries] = useState(() => getOfflineAudioEntries());
  const [selectedSurah, setSelectedSurah] = useState(currentSurah);
  const [cacheSize, setCacheSize] = useState(0);
  const [storageSnapshot, setStorageSnapshot] = useState(null);
  const [progress, setProgress] = useState({});
  const [busyKey, setBusyKey] = useState("");
  const [online, setOnline] = useState(() => navigator.onLine !== false);

  const refresh = useCallback(async () => {
    setEntries(getOfflineAudioEntries());
    const [nextCacheSize, nextStorageSnapshot] = await Promise.all([
      getCacheSize(),
      getStorageSnapshot(),
    ]);
    setCacheSize(nextCacheSize);
    setStorageSnapshot(nextStorageSnapshot);
  }, []);

  useEffect(() => {
    refresh();
    const handleOnline = () => setOnline(navigator.onLine !== false);
    window.addEventListener(OFFLINE_DOWNLOADS_CHANGED_EVENT, refresh);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOnline);
    return () => {
      window.removeEventListener(OFFLINE_DOWNLOADS_CHANGED_EVENT, refresh);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOnline);
    };
  }, [refresh]);

  const currentReciter = getReciter(reciterId, riwaya) || getReciter(reciterId);
  const selectedMeta = getSurah(selectedSurah);
  const selectedKey = `${riwaya}:${currentReciter?.id || reciterId}:${selectedSurah}`;

  const startDownload = async () => {
    if (!selectedMeta || !currentReciter || !online) return;
    setBusyKey(selectedKey);
    setProgress((value) => ({ ...value, [selectedKey]: { done: 0, total: 1 } }));
    const status = await downloadSurahForReciter(
      { surahMeta: selectedMeta, reciter: currentReciter, riwaya },
      (done, total) => setProgress((value) => ({
        ...value,
        [selectedKey]: { done, total },
      })),
    );
    setBusyKey("");
    await refresh();
    if (status === "done") {
      toast(localText(lang, "Sourate disponible hors connexion.", "Surah available offline.", "\u0627\u0644\u0633\u0648\u0631\u0629 \u0645\u062a\u0627\u062d\u0629 \u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644."), "success");
    } else if (status === "storage-full") {
      toast(localText(lang, "Espace insuffisant. Supprimez un ancien téléchargement puis réessayez.", "Not enough storage. Remove an older download and try again.", "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0633\u0627\u062d\u0629 \u062a\u062e\u0632\u064a\u0646 \u0643\u0627\u0641\u064a\u0629. \u0627\u062d\u0630\u0641 \u062a\u0646\u0632\u064a\u0644\u064b\u0627 \u0642\u062f\u064a\u0645\u064b\u0627 \u062b\u0645 \u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629."), "warning");
    } else if (status !== "cancelled") {
      toast(localText(lang, "Téléchargement incomplet. Vous pouvez le relancer.", "Download incomplete. You can retry it.", "\u0627\u0644\u062a\u0646\u0632\u064a\u0644 \u063a\u064a\u0631 \u0645\u0643\u062a\u0645\u0644. \u064a\u0645\u0643\u0646\u0643 \u0625\u0639\u0627\u062f\u062a\u0647."), "warning");
    }
  };

  const removeEntry = async (entry) => {
    const reciter = getReciter(entry.reciterId, entry.riwaya) || getReciter(entry.reciterId);
    const surahMeta = getSurah(entry.surahNum);
    if (!reciter || !surahMeta) return;
    const approved = await confirmAction({
      message: localText(
        lang,
        "Supprimer cet audio hors connexion ?",
        "Remove this offline audio?",
        "\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0635\u0648\u062a \u063a\u064a\u0631 \u0627\u0644\u0645\u062a\u0635\u0644\u061f",
      ),
      tone: "danger",
    });
    if (!approved) return;
    setBusyKey(entry.key);
    await removeSurahCacheForReciter({ surahMeta, reciter, riwaya: entry.riwaya });
    setBusyKey("");
    await refresh();
  };

  const clearAll = async () => {
    const approved = await confirmAction({
      message: localText(
        lang,
        "Supprimer tous les audios téléchargés ?",
        "Remove all downloaded audio?",
        "\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0643\u0644 \u0627\u0644\u062a\u0644\u0627\u0648\u0627\u062a \u0627\u0644\u0645\u0646\u0632\u0644\u0629\u061f",
      ),
      tone: "danger",
    });
    if (!approved) return;
    setBusyKey("all");
    await clearAllOfflineAudio();
    setBusyKey("");
    setProgress({});
    await refresh();
  };

  const statusLabel = (status, active = false) => ({
    done: localText(lang, "Prêt", "Ready", "\u062c\u0627\u0647\u0632"),
    partial: active
      ? localText(lang, "En cours", "In progress", "\u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0632\u064a\u0644")
      : localText(lang, "Partiel", "Partial", "\u062c\u0632\u0626\u064a"),
    cancelled: localText(lang, "Suspendu", "Paused", "\u0645\u062a\u0648\u0642\u0641"),
    error: localText(lang, "À relancer", "Retry", "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629"),
  })[status] || status;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          {localText(lang, "Sourate à rendre disponible", "Surah to make available", "\u0627\u0644\u0633\u0648\u0631\u0629 \u0644\u0644\u062a\u0646\u0632\u064a\u0644")}
          <select
            className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm"
            value={selectedSurah}
            onChange={(event) => setSelectedSurah(Number(event.target.value))}
          >
            {SURAHS.map((surah) => (
              <option key={surah.n} value={surah.n}>
                {surah.n}. {lang === "ar" ? surah.ar : lang === "en" ? surah.en : surah.fr}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={startDownload}
          disabled={!online || !currentReciter || Boolean(busyKey)}
        >
          <Download size={17} aria-hidden="true" />
          {busyKey === selectedKey
            ? localText(lang, "Téléchargement…", "Downloading…", "\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u0646\u0632\u064a\u0644\u2026")
            : localText(lang, "Télécharger", "Download", "\u062a\u0646\u0632\u064a\u0644")}
        </button>
        <p className="text-xs text-[var(--text-muted)] sm:col-span-2">
          {currentReciter?.nameFr || currentReciter?.nameEn || currentReciter?.name || reciterId} · {riwaya.toUpperCase()}
        </p>
      </div>

      {!online ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-[var(--text-primary)]" role="status">
          <WifiOff size={17} aria-hidden="true" />
          {localText(lang, "Vous êtes hors connexion. Les audios déjà prêts restent lisibles.", "You are offline. Previously downloaded audio remains available.", "\u0623\u0646\u062a \u063a\u064a\u0631 \u0645\u062a\u0635\u0644. \u0627\u0644\u062a\u0644\u0627\u0648\u0627\u062a \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u062a\u0628\u0642\u0649 \u0645\u062a\u0627\u062d\u0629.")}
        </div>
      ) : null}

      {storageSnapshot?.supported && storageSnapshot.quota > 0 ? (
        <div
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3"
          role="status"
          aria-label={localText(lang, "Utilisation du stockage", "Storage usage", "\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u062a\u062e\u0632\u064a\u0646")}
        >
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="inline-flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
              <ShieldCheck size={15} aria-hidden="true" />
              {storageSnapshot.persisted
                ? localText(lang, "Stockage protégé", "Persistent storage", "\u062a\u062e\u0632\u064a\u0646 \u062f\u0627\u0626\u0645")
                : localText(lang, "Stockage géré par le navigateur", "Browser-managed storage", "\u062a\u062e\u0632\u064a\u0646 \u064a\u062f\u064a\u0631\u0647 \u0627\u0644\u0645\u062a\u0635\u0641\u062d")}
            </span>
            <span className="text-[var(--text-muted)]">
              {formatStorageBytes(storageSnapshot.usage, lang)} / {formatStorageBytes(storageSnapshot.quota, lang)}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round((storageSnapshot.usageRatio || 0) * 100)}
          >
            <div
              className="h-full rounded-full bg-[var(--primary)]"
              style={{ width: `${Math.min(100, (storageSnapshot.usageRatio || 0) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--text-primary)]">
            {localText(lang, "Bibliothèque hors connexion", "Offline library", "\u0645\u0643\u062a\u0628\u0629 \u0628\u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644")}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {entries.length} {localText(lang, "élément(s)", "item(s)", "\u0639\u0646\u0635\u0631")} · {formatMegabytes(cacheSize, lang)}
          </p>
        </div>
        {entries.length ? (
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-500/25 px-3 py-2 text-xs font-semibold text-red-600" onClick={clearAll} disabled={Boolean(busyKey)}>
            <Trash2 size={14} aria-hidden="true" />
            {localText(lang, "Tout supprimer", "Remove all", "\u062d\u0630\u0641 \u0627\u0644\u0643\u0644")}
          </button>
        ) : null}
      </div>

      {entries.length ? (
        <ul className="grid gap-3">
          {entries.map((entry) => {
            const live = progress[entry.key];
            const downloaded = live?.done ?? entry.downloaded ?? 0;
            const total = live?.total ?? entry.total ?? 1;
            const percent = entry.status === "done" ? 100 : Math.round((downloaded / total) * 100);
            return (
              <li key={entry.key} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm text-[var(--text-primary)]">
                      {surahName(entry.surahNum, lang)}
                    </strong>
                    <span className="block truncate text-xs text-[var(--text-muted)]">
                      {entry.reciterName || entry.reciterId} · {entry.riwaya.toUpperCase()}
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[0.7rem] font-bold text-[var(--text-secondary)]">
                    {statusLabel(entry.status, busyKey === entry.key)}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]" aria-label={`${percent}%`} role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
                  <div className="h-full rounded-full bg-[var(--primary)] transition-[width]" style={{ width: `${percent}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                  <span>{downloaded}/{total} · {percent}%</span>
                  {entry.status === "partial" && busyKey === entry.key ? (
                    <button type="button" className="font-bold text-amber-600" onClick={() => cancelOfflineDownload(entry.key)}>
                      {localText(lang, "Suspendre", "Pause", "\u0625\u064a\u0642\u0627\u0641")}
                    </button>
                  ) : (
                    <button type="button" className="inline-flex items-center gap-1 font-bold text-red-600 disabled:opacity-50" onClick={() => removeEntry(entry)} disabled={Boolean(busyKey)}>
                      <Trash2 size={13} aria-hidden="true" />
                      {localText(lang, "Supprimer", "Remove", "\u062d\u0630\u0641")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--text-muted)]">
          <HardDrive size={28} aria-hidden="true" />
          <p className="text-sm">{localText(lang, "Aucun audio téléchargé pour le moment.", "No downloaded audio yet.", "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0644\u0627\u0648\u0627\u062a \u0645\u0646\u0632\u0644\u0629 \u062d\u0627\u0644\u064a\u064b\u0627.")}</p>
        </div>
      )}
    </div>
  );
}

function ExportPanel({ lang, cloud = false }) {
  const [format, setFormat] = useState("json");
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeBookmarks, setIncludeBookmarks] = useState(true);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const options = { format, includeNotes, includeBookmarks, lang };
  const enabled = includeNotes || includeBookmarks;

  const handleDownload = async () => {
    if (!enabled) return;
    setBusy(true);
    try {
      await downloadCollections(options);
      toast(localText(lang, "Export créé.", "Export created.", "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0635\u062f\u064a\u0631."), "success");
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!enabled || !consent) return;
    setBusy(true);
    try {
      const result = await shareCollections(options);
      toast(
        result.shared
          ? localText(lang, "Fichier remis au service que vous avez choisi.", "File handed to the service you selected.", "\u062a\u0645 \u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0645\u0644\u0641 \u0625\u0644\u0649 \u0627\u0644\u062e\u062f\u0645\u0629 \u0627\u0644\u062a\u064a \u0627\u062e\u062a\u0631\u062a\u0647\u0627.")
          : localText(lang, "Partage système indisponible : le fichier a été téléchargé.", "System sharing unavailable: the file was downloaded.", "\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629: \u062a\u0645 \u062a\u0646\u0632\u064a\u0644 \u0627\u0644\u0645\u0644\u0641."),
        "success",
      );
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast(localText(lang, "Le partage a échoué.", "Sharing failed.", "\u0641\u0634\u0644\u062a \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629."), "error");
      }
    } finally {
      setBusy(false);
      setConsent(false);
    }
  };

  const handleDiagnostics = async () => {
    setBusy(true);
    try {
      await downloadDiagnostics();
      toast(
        localText(
          lang,
          "Diagnostic local exporté.",
          "Local diagnostics exported.",
          "\u062a\u0645 \u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u062a\u0634\u062e\u064a\u0635 \u0627\u0644\u0645\u062d\u0644\u064a.",
        ),
        "success",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const result = await importFromFile(file);
      toast(localText(
        lang,
        `${result.notes} note(s) et ${result.bookmarks} favori(s) importés.`,
        `${result.notes} note(s) and ${result.bookmarks} bookmark(s) imported.`,
        `\u062a\u0645 \u0627\u0633\u062a\u064a\u0631\u0627\u062f ${result.notes} \u0645\u0644\u0627\u062d\u0638\u0629 \u0648${result.bookmarks} \u0625\u0634\u0627\u0631\u0629.`,
      ), "success");
    } catch {
      toast(localText(lang, "Fichier de sauvegarde invalide.", "Invalid backup file.", "\u0645\u0644\u0641 \u0627\u0644\u0646\u0633\u062e\u0629 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d."), "error");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-5">
      {cloud ? (
        <div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-sky-600" size={20} aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">{localText(lang, "Passerelle cloud manuelle", "Manual cloud bridge", "\u062c\u0633\u0631 \u0633\u062d\u0627\u0628\u064a \u064a\u062f\u0648\u064a")}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                {localText(
                  lang,
                  "MushafPlus ne se connecte à aucun compte et n’envoie rien en arrière-plan. À chaque action, vous choisissez explicitement l’application ou le disque cloud destinataire.",
                  "MushafPlus connects to no account and sends nothing in the background. For every action, you explicitly choose the destination app or cloud drive.",
                  "\u0644\u0627 \u064a\u062a\u0635\u0644 MushafPlus \u0628\u0623\u064a \u062d\u0633\u0627\u0628 \u0648\u0644\u0627 \u064a\u0631\u0633\u0644 \u0634\u064a\u0626\u064b\u0627 \u0641\u064a \u0627\u0644\u062e\u0644\u0641\u064a\u0629. \u0623\u0646\u062a \u062a\u062e\u062a\u0627\u0631 \u0627\u0644\u0648\u062c\u0647\u0629 \u0641\u064a \u0643\u0644 \u0645\u0631\u0629.",
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {localText(lang, "Créez un document dédié, lisible et portable, sans inclure vos réglages.", "Create a dedicated, readable and portable document without including your settings.", "\u0623\u0646\u0634\u0626 \u0645\u0633\u062a\u0646\u062f\u064b\u0627 \u0645\u0633\u062a\u0642\u0644\u064b\u0627 \u0648\u0642\u0627\u0628\u0644\u064b\u0627 \u0644\u0644\u0642\u0631\u0627\u0621\u0629 \u062f\u0648\u0646 \u062a\u0636\u0645\u064a\u0646 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a.")}
        </p>
      )}

      <fieldset className="grid gap-3 rounded-2xl border border-[var(--border)] p-4">
        <legend className="px-2 text-sm font-bold text-[var(--text-primary)]">{localText(lang, "Contenu", "Content", "\u0627\u0644\u0645\u062d\u062a\u0648\u0649")}</legend>
        <label className="flex min-h-10 items-center gap-3 text-sm text-[var(--text-primary)]">
          <input type="checkbox" checked={includeNotes} onChange={(event) => setIncludeNotes(event.target.checked)} />
          {localText(lang, "Notes personnelles", "Personal notes", "\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0634\u062e\u0635\u064a\u0629")}
        </label>
        <label className="flex min-h-10 items-center gap-3 text-sm text-[var(--text-primary)]">
          <input type="checkbox" checked={includeBookmarks} onChange={(event) => setIncludeBookmarks(event.target.checked)} />
          {localText(lang, "Favoris", "Bookmarks", "\u0627\u0644\u0645\u0641\u0636\u0644\u0629")}
        </label>
      </fieldset>

      {!cloud ? (
        <fieldset className="grid grid-cols-3 gap-2">
          <legend className="sr-only">Format</legend>
          {["json", "markdown", "csv"].map((item) => (
            <button key={item} type="button" className="min-h-10 rounded-xl border border-[var(--border)] px-3 text-xs font-bold uppercase text-[var(--text-primary)] data-[active=true]:border-[var(--primary)] data-[active=true]:bg-[rgba(var(--primary-rgb),0.08)] data-[active=true]:text-[var(--primary)]" data-active={format === item} aria-pressed={format === item} onClick={() => setFormat(item)}>
              {item === "markdown" ? "MD" : item}
            </button>
          ))}
        </fieldset>
      ) : null}

      {cloud ? (
        <>
          <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3 text-sm text-[var(--text-secondary)]">
            <input className="mt-1" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            {localText(lang, "Je comprends que le fichier contient les données sélectionnées et j’autorise son transfert vers le service que je choisirai.", "I understand that the file contains the selected data and authorize its transfer to the service I choose.", "\u0623\u0641\u0647\u0645 \u0623\u0646 \u0627\u0644\u0645\u0644\u0641 \u064a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u062d\u062f\u062f\u0629 \u0648\u0623\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0646\u0642\u0644\u0647 \u0625\u0644\u0649 \u0627\u0644\u062e\u062f\u0645\u0629 \u0627\u0644\u062a\u064a \u0623\u062e\u062a\u0627\u0631\u0647\u0627.")}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white disabled:opacity-50" onClick={handleShare} disabled={!enabled || !consent || busy}>
              <Cloud size={17} aria-hidden="true" />
              {localText(lang, "Choisir une destination", "Choose destination", "\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0648\u062c\u0647\u0629")}
            </button>
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--text-primary)]">
              <Upload size={17} aria-hidden="true" />
              {localText(lang, "Restaurer un fichier", "Restore a file", "\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0645\u0644\u0641")}
              <input type="file" className="sr-only" accept=".json,application/json" onChange={handleImport} disabled={busy} />
            </label>
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white disabled:opacity-50" onClick={handleDownload} disabled={!enabled || busy}>
            <FileDown size={17} aria-hidden="true" />
            {localText(lang, "Créer l’export", "Create export", "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0635\u062f\u064a\u0631")}
          </button>
          <button type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--text-primary)] disabled:opacity-50" onClick={handleDiagnostics} disabled={busy}>
            <ShieldCheck size={17} aria-hidden="true" />
            {localText(lang, "Diagnostic local", "Local diagnostics", "\u062a\u0634\u062e\u064a\u0635 \u0645\u062d\u0644\u064a")}
          </button>
        </div>
      )}
    </div>
  );
}

function MemorizationPanel({ lang, onNavigate }) {
  const [plan, setPlan] = useState(() => getMemorizationPlan());
  const [presetId, setPresetId] = useState("fatiha");
  const [customSurah, setCustomSurah] = useState(1);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const refreshPlan = () => {
      setPlan(getMemorizationPlan());
      forceRefresh((value) => value + 1);
    };
    window.addEventListener(MEMORIZATION_PLAN_CHANGED_EVENT, refreshPlan);
    window.addEventListener("quran-memorization-updated", refreshPlan);
    return () => {
      window.removeEventListener(MEMORIZATION_PLAN_CHANGED_EVENT, refreshPlan);
      window.removeEventListener("quran-memorization-updated", refreshPlan);
    };
  }, []);

  const summary = plan ? getMemorizationPlanSummary(plan) : null;
  const queue = plan ? getTodayMemorizationQueue(plan) : [];
  const planSurahs = plan ? getPlanSurahs(plan) : [];

  const createPlan = () => {
    saveMemorizationPlan({
      presetId,
      customSurah: presetId === "custom" ? customSurah : null,
      dailyGoal,
      createdAt: Date.now(),
    });
    setPlan(getMemorizationPlan());
  };

  if (!plan) {
    return (
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {localText(lang, "Choisissez un périmètre stable et un petit objectif quotidien. Les niveaux attribués à chaque verset alimentent automatiquement la progression.", "Choose a stable scope and a small daily goal. The levels assigned to each verse automatically feed your progress.", "\u0627\u062e\u062a\u0631 \u0646\u0637\u0627\u0642\u064b\u0627 \u062b\u0627\u0628\u062a\u064b\u0627 \u0648\u0647\u062f\u0641\u064b\u0627 \u064a\u0648\u0645\u064a\u064b\u0627 \u0635\u063a\u064a\u0631\u064b\u0627. \u062a\u062d\u062f\u0651\u062b \u0645\u0633\u062a\u0648\u064a\u0627\u062a \u0627\u0644\u0622\u064a\u0627\u062a \u062a\u0642\u062f\u0645\u0643 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627.")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MEMORIZATION_PRESETS.map((preset) => (
            <button key={preset.id} type="button" className="rounded-2xl border border-[var(--border)] p-4 text-start data-[active=true]:border-[var(--primary)] data-[active=true]:bg-[rgba(var(--primary-rgb),0.08)]" data-active={presetId === preset.id} aria-pressed={presetId === preset.id} onClick={() => { setPresetId(preset.id); setDailyGoal(preset.dailyGoal); }}>
              <strong className="block text-sm text-[var(--text-primary)]">{getMemorizationPresetMeta(preset.id, lang)}</strong>
              <span className="mt-1 block text-xs text-[var(--text-muted)]">{preset.surahs.length} {localText(lang, "sourate(s)", "surah(s)", "\u0633\u0648\u0631\u0629")}</span>
            </button>
          ))}
          <button type="button" className="rounded-2xl border border-[var(--border)] p-4 text-start data-[active=true]:border-[var(--primary)] data-[active=true]:bg-[rgba(var(--primary-rgb),0.08)]" data-active={presetId === "custom"} aria-pressed={presetId === "custom"} onClick={() => setPresetId("custom")}>
            <strong className="block text-sm text-[var(--text-primary)]">{localText(lang, "Une sourate au choix", "A surah of your choice", "\u0633\u0648\u0631\u0629 \u0645\u0646 \u0627\u062e\u062a\u064a\u0627\u0631\u0643")}</strong>
            <span className="mt-1 block text-xs text-[var(--text-muted)]">{localText(lang, "Parcours personnalisé", "Custom journey", "\u0645\u0633\u0627\u0631 \u0645\u062e\u0635\u0635")}</span>
          </button>
        </div>
        {presetId === "custom" ? (
          <label className="grid gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            {localText(lang, "Sourate", "Surah", "\u0627\u0644\u0633\u0648\u0631\u0629")}
            <select className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3" value={customSurah} onChange={(event) => setCustomSurah(Number(event.target.value))}>
              {SURAHS.map((surah) => <option key={surah.n} value={surah.n}>{surah.n}. {lang === "ar" ? surah.ar : surah.en}</option>)}
            </select>
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          {localText(lang, "Versets par séance", "Verses per session", "\u0622\u064a\u0627\u062a \u0641\u064a \u0643\u0644 \u062c\u0644\u0633\u0629")}
          <input type="number" min="1" max="20" className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3" value={dailyGoal} onChange={(event) => setDailyGoal(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} />
        </label>
        <button type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white" onClick={createPlan}>
          <Brain size={17} aria-hidden="true" />
          {localText(lang, "Créer mon parcours", "Create my journey", "\u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u0627\u0631\u064a")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">{localText(lang, "Parcours actif", "Active journey", "\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0646\u0634\u0637")}</span>
            <h3 className="mt-1 font-bold text-[var(--text-primary)]">
              {plan.presetId === "custom" ? surahName(plan.customSurah, lang) : getMemorizationPresetMeta(plan.presetId, lang)}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{planSurahs.length} {localText(lang, "sourate(s)", "surah(s)", "\u0633\u0648\u0631\u0629")} · {plan.dailyGoal} {localText(lang, "versets/séance", "verses/session", "\u0622\u064a\u0627\u062a/\u062c\u0644\u0633\u0629")}</p>
          </div>
          <strong className="text-2xl text-[var(--primary)]">{summary.percent}%</strong>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg-card)]" role="progressbar" aria-valuenow={summary.percent} aria-valuemin="0" aria-valuemax="100">
          <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${summary.percent}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-[var(--text-muted)]">
          <span><strong className="block text-base text-[var(--text-primary)]">{summary.inProgress}</strong>{localText(lang, "En cours", "Learning", "\u0642\u064a\u062f \u0627\u0644\u062d\u0641\u0638")}</span>
          <span><strong className="block text-base text-[var(--text-primary)]">{summary.learned}</strong>{localText(lang, "Consolidés", "Consolidated", "\u0645\u062b\u0628\u062a")}</span>
          <span><strong className="block text-base text-[var(--text-primary)]">{summary.mastered}</strong>{localText(lang, "Maîtrisés", "Mastered", "\u0645\u062a\u0642\u0646")}</span>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-[var(--text-primary)]">{localText(lang, "Séance proposée", "Suggested session", "\u0627\u0644\u062c\u0644\u0633\u0629 \u0627\u0644\u0645\u0642\u062a\u0631\u062d\u0629")}</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{localText(lang, "Priorité aux versets les moins consolidés.", "Least consolidated verses come first.", "\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629 \u0644\u0644\u0622\u064a\u0627\u062a \u0627\u0644\u0623\u0642\u0644 \u062a\u062b\u0628\u064a\u062a\u064b\u0627.")}</p>
      </div>
      {queue.length ? (
        <ol className="grid gap-2">
          {queue.map((ref, index) => (
            <li key={`${ref.surah}:${ref.ayah}`}>
              <button type="button" className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-[var(--border)] px-4 text-start transition-colors hover:border-[var(--primary)] hover:bg-[var(--bg-secondary)]" onClick={() => onNavigate(ref, true)}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text-primary)]">{surahName(ref.surah, lang)} · {ref.surah}:{ref.ayah}</span>
                <span className="text-xs text-[var(--text-muted)]">{ref.level}/5</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-center text-sm font-semibold text-[var(--text-primary)]">
          {localText(lang, "Tous les versets du parcours sont maîtrisés.", "All verses in this journey are mastered.", "\u062a\u0645 \u0625\u062a\u0642\u0627\u0646 \u062c\u0645\u064a\u0639 \u0622\u064a\u0627\u062a \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0627\u0631.")}
        </div>
      )}
      <button type="button" className="inline-flex items-center gap-2 text-xs font-bold text-red-600" onClick={async () => {
        const approved = await confirmAction({
          message: localText(lang, "Remplacer ce parcours ? Les niveaux des versets seront conservés.", "Replace this journey? Verse levels will be kept.", "\u0627\u0633\u062a\u0628\u062f\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0627\u0631\u061f \u0633\u062a\u0628\u0642\u0649 \u0645\u0633\u062a\u0648\u064a\u0627\u062a \u0627\u0644\u0622\u064a\u0627\u062a."),
          tone: "danger",
        });
        if (approved) { clearMemorizationPlan(); setPlan(null); }
      }}>
        <Trash2 size={14} aria-hidden="true" />
        {localText(lang, "Changer de parcours", "Change journey", "\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0645\u0633\u0627\u0631")}
      </button>
    </div>
  );
}

function ThemesPanel({ lang, onNavigate }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const topics = useMemo(() => THEMATIC_INDEX.filter((topic) => {
    if (!normalizedQuery) return true;
    return Object.values(topic.labels).some((label) => label.toLocaleLowerCase().includes(normalizedQuery));
  }), [normalizedQuery]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={17} aria-hidden="true" />
        <input type="search" className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] ps-10 pe-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={localText(lang, "Rechercher un thème…", "Search a theme…", "\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0645\u0648\u0636\u0648\u0639\u2026")} aria-label={localText(lang, "Rechercher un thème", "Search a theme", "\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0645\u0648\u0636\u0648\u0639")} />
      </div>
      <p className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-xs leading-relaxed text-[var(--text-muted)]">
        {localText(lang, "Repères de lecture non exhaustifs : chaque entrée renvoie directement aux versets, sans remplacer un tafsir.", "Non-exhaustive reading landmarks: each entry links directly to verses and does not replace tafsir.", "\u0645\u0639\u0627\u0644\u0645 \u0642\u0631\u0627\u0626\u064a\u0629 \u063a\u064a\u0631 \u0634\u0627\u0645\u0644\u0629: \u0643\u0644 \u0645\u062f\u062e\u0644 \u064a\u062d\u064a\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u0627\u0644\u0622\u064a\u0627\u062a \u0648\u0644\u0627 \u064a\u063a\u0646\u064a \u0639\u0646 \u0627\u0644\u062a\u0641\u0633\u064a\u0631.")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((topic) => (
          <article key={topic.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center gap-2">
              <BookOpenText size={17} className="text-[var(--primary)]" aria-hidden="true" />
              <h3 className="font-bold text-[var(--text-primary)]">{thematicLabel(topic, lang)}</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {topic.refs.map((ref) => (
                <button key={`${topic.id}-${ref.surah}-${ref.from}`} type="button" className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]" onClick={() => onNavigate({ surah: ref.surah, ayah: ref.from }, false)}>
                  {surahName(ref.surah, lang)} {ref.surah}:{ref.from}{ref.to ? `-${ref.to}` : ""}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {!topics.length ? <p className="py-8 text-center text-sm text-[var(--text-muted)]">{localText(lang, "Aucun thème trouvé.", "No theme found.", "\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0645\u0648\u0636\u0648\u0639.")}</p> : null}
    </div>
  );
}

export default function FutureFeaturesModal() {
  const lang = useAppSelector((state) => state.lang);
  const currentSurah = useAppSelector((state) => state.currentSurah);
  const reciter = useAppSelector((state) => state.reciter);
  const riwaya = useAppSelector((state) => state.riwaya);
  const initialTab = useAppSelector((state) => state.futureHubOpen);
  const { set } = useAppActions();
  const [activeTab, setActiveTab] = useState(TAB_IDS.includes(initialTab) ? initialTab : "offline");

  const close = () => set({ futureHubOpen: null });
  const backToTools = () => set({ futureHubOpen: null, toolsHubOpen: true });
  const handleTabKeyDown = (event) => {
    const currentIndex = TAB_IDS.indexOf(activeTab);
    let nextIndex = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % TAB_IDS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + TAB_IDS.length) % TAB_IDS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TAB_IDS.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = TAB_IDS[nextIndex];
    setActiveTab(nextTab);
    document.getElementById(`future-tab-${nextTab}`)?.focus();
  };
  const navigateToVerse = (ref, memorization) => set({
    futureHubOpen: null,
    toolsHubOpen: false,
    showHome: false,
    showDuas: false,
    displayMode: "surah",
    currentSurah: ref.surah,
    currentAyah: ref.ayah,
    memMode: memorization,
  });

  const tabs = [
    { id: "offline", icon: HardDrive, label: localText(lang, "Offline", "Offline", "\u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644") },
    { id: "export", icon: FileDown, label: localText(lang, "Exports", "Exports", "\u0627\u0644\u062a\u0635\u062f\u064a\u0631") },
    { id: "memorization", icon: Brain, label: localText(lang, "Mémoriser", "Memorize", "\u0627\u0644\u062d\u0641\u0638") },
    { id: "themes", icon: BookOpenText, label: localText(lang, "Thèmes", "Topics", "\u0627\u0644\u0645\u0648\u0627\u0636\u064a\u0639") },
    { id: "cloud", icon: Cloud, label: "Cloud" },
  ];

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) close(); }}>
      <Dialog.Portal>
        <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
          <Dialog.Content className="modal !flex !max-h-[92vh] !w-full !max-w-4xl !flex-col !overflow-hidden !rounded-[1.75rem] !border !border-[var(--border)] !bg-[var(--bg-card)] !shadow-[0_32px_84px_rgba(1,8,22,0.5)]" onClick={(event) => event.stopPropagation()} onEscapeKeyDown={(event) => { event.preventDefault(); close(); }} onInteractOutside={close} aria-describedby="future-features-description">
            <FutureFeaturesHeader
              activeTab={activeTab}
              lang={lang}
              onBack={backToTools}
              onClose={close}
              onSelectTab={setActiveTab}
              onTabKeyDown={handleTabKeyDown}
              tabs={tabs}
            />

            <div className="min-h-0 flex-1 overflow-y-auto bg-[color-mix(in_srgb,var(--bg-secondary)_36%,var(--bg-card))] p-3 sm:p-5" role="tabpanel" id={`future-panel-${activeTab}`} aria-labelledby={`future-tab-${activeTab}`}>
              {activeTab === "offline" ? <OfflinePanel lang={lang} currentSurah={currentSurah} reciterId={reciter} riwaya={riwaya} /> : null}
              {activeTab === "export" ? <ExportPanel lang={lang} /> : null}
              {activeTab === "memorization" ? <MemorizationPanel lang={lang} onNavigate={navigateToVerse} /> : null}
              {activeTab === "themes" ? <ThemesPanel lang={lang} onNavigate={navigateToVerse} /> : null}
              {activeTab === "cloud" ? <ExportPanel lang={lang} cloud /> : null}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
