import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Check, Download, LoaderCircle, Play, X } from "lucide-react";
import { toast } from "../../lib/utils";
import {
  OFFLINE_DOWNLOADS_CHANGED_EVENT,
  cancelOfflineDownload,
  downloadSurahForReciter,
  getSurahDownloadEntry,
} from "../../services/downloadService";

function labelsFor(lang) {
  if (lang === "ar") {
    return {
      listen: "استمع",
      open: "افتح في المصحف",
      download: "تنزيل للاستماع دون اتصال",
      downloading: "جارٍ التنزيل",
      cancel: "إلغاء التنزيل",
      offline: "متاح دون اتصال",
      unavailable: "التنزيل غير متاح",
      readyToast: "أصبحت السورة متاحة دون اتصال.",
      partialToast: "اكتمل جزء من التنزيل. يمكنك إعادة المحاولة.",
      storageToast: "لا توجد مساحة تخزين كافية لهذا التنزيل.",
      errorToast: "تعذر تنزيل الصوت. تحقق من الاتصال ثم أعد المحاولة.",
    };
  }
  if (lang === "fr") {
    return {
      listen: "Écouter",
      open: "Ouvrir dans le lecteur",
      download: "Télécharger pour l’écoute hors connexion",
      downloading: "Téléchargement en cours",
      cancel: "Annuler le téléchargement",
      offline: "Disponible hors connexion",
      unavailable: "Téléchargement indisponible",
      readyToast: "La sourate est maintenant disponible hors connexion.",
      partialToast: "Téléchargement partiel. Vous pouvez le reprendre.",
      storageToast: "Espace de stockage insuffisant pour ce téléchargement.",
      errorToast: "Impossible de télécharger l’audio. Vérifiez la connexion puis réessayez.",
    };
  }
  return {
    listen: "Listen",
    open: "Open in reader",
    download: "Download for offline listening",
    downloading: "Downloading",
    cancel: "Cancel download",
    offline: "Available offline",
    unavailable: "Download unavailable",
    readyToast: "This surah is now available offline.",
    partialToast: "Part of the download completed. You can retry it.",
    storageToast: "There is not enough storage space for this download.",
    errorToast: "Audio download failed. Check your connection and try again.",
  };
}

function getProgress(entry) {
  const total = Number(entry?.total || 0);
  const downloaded = Number(entry?.downloaded || 0);
  return total > 0 ? Math.round((downloaded / total) * 100) : 0;
}

export default function RowActions({
  lang,
  surahLabel,
  surah,
  reciter,
  riwaya,
  onPlay,
  onOpen,
  onOpenIntent,
}) {
  const labels = labelsFor(lang);
  const canDownload = Boolean(surah?.n && reciter?.id && reciter?.cdn);
  const contextualLabel = (action) =>
    surahLabel ? `${action} — ${surahLabel}` : action;
  const readEntry = useCallback(
    () =>
      canDownload
        ? getSurahDownloadEntry(surah.n, reciter.id, riwaya)
        : null,
    [canDownload, reciter?.id, riwaya, surah?.n],
  );
  const [entry, setEntry] = useState(readEntry);
  const [isDownloading, setIsDownloading] = useState(false);
  const [liveProgress, setLiveProgress] = useState(() => getProgress(readEntry()));

  useEffect(() => {
    const refresh = () => {
      const nextEntry = readEntry();
      setEntry(nextEntry);
      if (!isDownloading) setLiveProgress(getProgress(nextEntry));
    };
    refresh();
    window.addEventListener(OFFLINE_DOWNLOADS_CHANGED_EVENT, refresh);
    return () =>
      window.removeEventListener(OFFLINE_DOWNLOADS_CHANGED_EVENT, refresh);
  }, [isDownloading, readEntry]);

  const isOffline = entry?.status === "done";
  const downloadLabel = useMemo(() => {
    if (!canDownload) return labels.unavailable;
    if (isOffline) return labels.offline;
    if (isDownloading) {
      return `${labels.downloading} ${liveProgress}% — ${labels.cancel}`;
    }
    return labels.download;
  }, [canDownload, isDownloading, isOffline, labels, liveProgress]);

  const handleDownload = async () => {
    if (!canDownload || isOffline) return;
    if (isDownloading) {
      if (entry?.key) cancelOfflineDownload(entry.key);
      return;
    }

    setIsDownloading(true);
    setLiveProgress(getProgress(entry));
    const result = await downloadSurahForReciter(
      { surahMeta: surah, reciter, riwaya },
      (done, total) => {
        setLiveProgress(total > 0 ? Math.round((done / total) * 100) : 0);
      },
    );
    setIsDownloading(false);
    const nextEntry = readEntry();
    setEntry(nextEntry);
    setLiveProgress(getProgress(nextEntry));

    if (result === "done") toast(labels.readyToast, "success");
    else if (result === "partial") toast(labels.partialToast, "warning");
    else if (result === "storage-full") toast(labels.storageToast, "warning");
    else if (result !== "cancelled") toast(labels.errorToast, "error");
  };

  return (
    <div className="recitation-row__actions">
      <button
        className="recitation-action-btn recitation-action-btn--primary"
        type="button"
        onClick={onPlay}
        title={contextualLabel(labels.listen)}
        aria-label={contextualLabel(labels.listen)}
      >
        <Play className="recitation-icon recitation-icon--sm" size={15} fill="currentColor" aria-hidden="true" />
        <span className="recitation-action-btn__label">{labels.listen}</span>
      </button>
      <button
        className="recitation-action-btn"
        type="button"
        onClick={onOpen}
        onPointerEnter={onOpenIntent}
        onPointerDown={onOpenIntent}
        onFocus={onOpenIntent}
        title={contextualLabel(labels.open)}
        aria-label={contextualLabel(labels.open)}
      >
        <BookOpen className="recitation-icon recitation-icon--sm" size={15} aria-hidden="true" />
      </button>
      <button
        className={`recitation-action-btn recitation-action-btn--download${isOffline ? " is-offline" : ""}${isDownloading ? " is-downloading" : ""}`}
        type="button"
        onClick={handleDownload}
        disabled={!canDownload}
        aria-disabled={isOffline || undefined}
        title={contextualLabel(downloadLabel)}
        aria-label={contextualLabel(downloadLabel)}
      >
        {isOffline ? (
          <Check className="recitation-icon recitation-icon--sm" size={15} aria-hidden="true" />
        ) : isDownloading ? (
          <X className="recitation-icon recitation-icon--sm" size={15} aria-hidden="true" />
        ) : (
          <Download className="recitation-icon recitation-icon--sm" size={15} aria-hidden="true" />
        )}
        {isDownloading ? (
          <span className="recitation-download-progress" aria-hidden="true">
            {liveProgress}%
          </span>
        ) : null}
        {isDownloading ? (
          <LoaderCircle className="recitation-download-spinner" size={10} aria-hidden="true" />
        ) : null}
      </button>
    </div>
  );
}
