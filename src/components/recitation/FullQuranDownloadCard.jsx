import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleAlert,
  Download,
  HardDriveDownload,
  LoaderCircle,
  RotateCcw,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "../../lib/utils";
import {
  OFFLINE_DOWNLOADS_CHANGED_EVENT,
  OFFLINE_FULL_QURAN_PROGRESS_EVENT,
  cancelFullQuranDownload,
  downloadFullQuranForReciter,
  getFullQuranDownloadSummary,
  isFullQuranDownloadActive,
  removeFullQuranCacheForReciter,
} from "../../services/downloadService";

function labelsFor(lang) {
  if (lang === "ar") {
    return {
      eyebrow: "الاستماع دون اتصال",
      title: "تنزيل القرآن كاملًا",
      idle: "نزّل السور الـ 114 بصوت هذا القارئ.",
      ready: "السور الـ 114 متاحة دون اتصال على هذا الجهاز.",
      progress: "{done} من 114 سورة متاحة",
      estimate: "الحجم التقديري: {size}",
      download: "تنزيل الكل",
      resume: "متابعة التنزيل",
      cancel: "إلغاء",
      remove: "حذف التنزيل",
      confirmTitle: "تنزيل التلاوة كاملة؟",
      confirmBody: "يُنصح باستخدام Wi-Fi وإبقاء التطبيق مفتوحًا حتى اكتمال التنزيل.",
      confirm: "بدء التنزيل",
      keep: "رجوع",
      removeTitle: "حذف التلاوة المحفوظة؟",
      removeBody: "ستُحذف الملفات الصوتية لهذا القارئ فقط من هذا الجهاز.",
      confirmRemove: "حذف الملفات",
      readyToast: "أصبحت تلاوة القرآن كاملة متاحة دون اتصال.",
      partialToast: "توقف التنزيل. يمكنك متابعته من حيث توقف.",
      storageToast: "لا توجد مساحة تخزين كافية لهذا التنزيل.",
      errorToast: "تعذر إكمال التنزيل. تحقق من الاتصال وحاول مجددًا.",
      removedToast: "تم حذف التلاوة المحفوظة من هذا الجهاز.",
      unavailable: "التنزيل غير متاح لهذا القارئ.",
      retained: "تبقى الملفات متاحة ما دامت بيانات المتصفح محفوظة.",
    };
  }
  if (lang === "fr") {
    return {
      eyebrow: "Écoute hors connexion",
      title: "Télécharger le Coran complet",
      idle: "Enregistrez les 114 sourates de ce récitateur.",
      ready: "Les 114 sourates sont disponibles hors connexion sur cet appareil.",
      progress: "{done} sur 114 sourates disponibles",
      estimate: "Taille estimée : {size}",
      download: "Tout télécharger",
      resume: "Reprendre",
      cancel: "Annuler",
      remove: "Supprimer le téléchargement",
      confirmTitle: "Télécharger toute la récitation ?",
      confirmBody: "Utilisez de préférence le Wi-Fi et gardez l’application ouverte jusqu’à la fin.",
      confirm: "Lancer le téléchargement",
      keep: "Retour",
      removeTitle: "Supprimer la récitation hors ligne ?",
      removeBody: "Seuls les fichiers audio de ce récitateur seront retirés de cet appareil.",
      confirmRemove: "Supprimer les fichiers",
      readyToast: "Le Coran complet est maintenant disponible hors connexion.",
      partialToast: "Téléchargement interrompu. Vous pourrez le reprendre sans recommencer.",
      storageToast: "Espace insuffisant pour télécharger cette récitation complète.",
      errorToast: "Le téléchargement n’a pas pu se terminer. Vérifiez la connexion puis réessayez.",
      removedToast: "La récitation hors ligne a été supprimée de cet appareil.",
      unavailable: "Téléchargement indisponible pour ce récitateur.",
      retained: "Les fichiers restent disponibles tant que les données du navigateur sont conservées.",
    };
  }
  return {
    eyebrow: "Offline listening",
    title: "Download the complete Quran",
    idle: "Save all 114 surahs from this reciter.",
    ready: "All 114 surahs are available offline on this device.",
    progress: "{done} of 114 surahs available",
    estimate: "Estimated size: {size}",
    download: "Download all",
    resume: "Resume",
    cancel: "Cancel",
    remove: "Remove download",
    confirmTitle: "Download the complete recitation?",
    confirmBody: "Wi-Fi is recommended. Keep the app open until the download finishes.",
    confirm: "Start download",
    keep: "Go back",
    removeTitle: "Remove the offline recitation?",
    removeBody: "Only this reciter’s audio files will be removed from this device.",
    confirmRemove: "Remove files",
    readyToast: "The complete Quran is now available offline.",
    partialToast: "Download stopped. You can resume without starting over.",
    storageToast: "There is not enough space for this complete recitation.",
    errorToast: "The download could not finish. Check your connection and try again.",
    removedToast: "The offline recitation was removed from this device.",
    unavailable: "Downloads are unavailable for this reciter.",
    retained: "Files remain available while browser data is retained.",
  };
}

function formatBytes(bytes, lang) {
  const value = Math.max(0, Number(bytes) || 0);
  const locale = lang === "ar" ? "ar" : lang === "fr" ? "fr-FR" : "en-US";
  if (value >= 1024 ** 3) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1024 ** 3)} Go`;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value / 1024 ** 2)} Mo`;
}

export default function FullQuranDownloadCard({ reciter, riwaya, lang }) {
  const labels = useMemo(() => labelsFor(lang), [lang]);
  const mountedRef = useRef(true);
  const readState = useCallback(() => ({
    summary: getFullQuranDownloadSummary(reciter, riwaya),
    active: isFullQuranDownloadActive(reciter?.id, riwaya),
  }), [reciter, riwaya]);
  const [downloadState, setDownloadState] = useState(readState);
  const [confirmation, setConfirmation] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    setDownloadState(readState());
    const refresh = () => setDownloadState(readState());
    const handleFullProgress = (event) => {
      if (event.detail?.reciterId !== reciter?.id || event.detail?.riwaya !== riwaya) return;
      setDownloadState({
        summary: { ...getFullQuranDownloadSummary(reciter, riwaya), ...event.detail },
        active: event.detail.status === "downloading",
      });
    };
    window.addEventListener(OFFLINE_DOWNLOADS_CHANGED_EVENT, refresh);
    window.addEventListener(OFFLINE_FULL_QURAN_PROGRESS_EVENT, handleFullProgress);
    return () => {
      mountedRef.current = false;
      window.removeEventListener(OFFLINE_DOWNLOADS_CHANGED_EVENT, refresh);
      window.removeEventListener(OFFLINE_FULL_QURAN_PROGRESS_EVENT, handleFullProgress);
    };
  }, [readState, reciter, riwaya]);

  const summary = downloadState.summary;
  const isRunning = downloadState.active;
  const isReady = summary.status === "done" && !isRunning;
  const hasDownload = summary.downloadedItems > 0;
  const canDownload = Boolean(
    reciter?.id &&
    reciter?.cdn &&
    typeof window !== "undefined" &&
    "caches" in window,
  );
  const progressText = labels.progress.replace("{done}", summary.completedSurahs);
  const estimateText = labels.estimate.replace(
    "{size}",
    formatBytes(summary.estimatedRemainingBytes || summary.estimatedBytes, lang),
  );

  const beginDownload = async () => {
    setConfirmation(null);
    setDownloadState((current) => ({ ...current, active: true }));
    const result = await downloadFullQuranForReciter(
      { reciter, riwaya },
      (detail) => {
        if (!mountedRef.current) return;
        setDownloadState((current) => ({
          summary: { ...current.summary, ...detail },
          active: detail.status === "downloading",
        }));
      },
    );
    if (!mountedRef.current) return;
    setDownloadState(readState());
    if (result === "done") toast(labels.readyToast, "success");
    else if (result === "storage-full") toast(labels.storageToast, "warning");
    else if (result === "partial" || result === "cancelled") toast(labels.partialToast, "warning");
    else toast(labels.errorToast, "error");
  };

  const removeDownload = async () => {
    setConfirmation(null);
    setIsRemoving(true);
    const removed = await removeFullQuranCacheForReciter({ reciter, riwaya });
    if (!mountedRef.current) return;
    setIsRemoving(false);
    setDownloadState(readState());
    toast(removed ? labels.removedToast : labels.errorToast, removed ? "success" : "error");
  };

  const handlePrimaryAction = () => {
    if (!canDownload || isReady) return;
    if (isRunning) {
      cancelFullQuranDownload(reciter.id, riwaya);
      return;
    }
    setConfirmation("download");
  };

  const statusMessage = isReady
    ? labels.ready
    : hasDownload || isRunning
      ? progressText
      : labels.idle;

  return (
    <section className={`full-quran-download${isReady ? " is-ready" : ""}`} aria-labelledby="full-quran-download-title">
      <div className="full-quran-download__icon" aria-hidden="true">
        {isReady ? <Check size={18} /> : isRunning ? <LoaderCircle className="is-spinning" size={18} /> : <HardDriveDownload size={18} />}
      </div>

      <div className="full-quran-download__content">
        <span className="full-quran-download__eyebrow">{labels.eyebrow}</span>
        <h4 id="full-quran-download-title">{labels.title}</h4>
        <p aria-live="polite">{statusMessage}</p>
        <div className="full-quran-download__meta">
          <span><Wifi size={12} aria-hidden="true" />{estimateText}</span>
          <span>{labels.retained}</span>
        </div>
        {(hasDownload || isRunning) ? (
          <div className="full-quran-download__progress">
            <progress max="100" value={summary.percent} aria-label={progressText} />
            <strong>{summary.percent}%</strong>
          </div>
        ) : null}
      </div>

      <div className="full-quran-download__actions">
        <button
          type="button"
          className={`full-quran-download__primary${isRunning ? " is-cancel" : ""}`}
          onClick={handlePrimaryAction}
          disabled={!canDownload || isReady || isRemoving}
          title={!canDownload ? labels.unavailable : undefined}
        >
          {isRunning ? <X size={15} aria-hidden="true" /> : hasDownload ? <RotateCcw size={15} aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
          {isRunning ? labels.cancel : hasDownload ? labels.resume : labels.download}
        </button>
        {hasDownload && !isRunning ? (
          <button
            type="button"
            className="full-quran-download__remove"
            onClick={() => setConfirmation("remove")}
            disabled={isRemoving}
            title={labels.remove}
            aria-label={labels.remove}
          >
            {isRemoving ? <LoaderCircle className="is-spinning" size={15} /> : <Trash2 size={15} />}
          </button>
        ) : null}
      </div>

      {confirmation ? (
        <div className="full-quran-download__confirm" role="alertdialog" aria-modal="false">
          <CircleAlert size={18} aria-hidden="true" />
          <div>
            <strong>{confirmation === "remove" ? labels.removeTitle : labels.confirmTitle}</strong>
            <p>{confirmation === "remove" ? labels.removeBody : labels.confirmBody}</p>
          </div>
          <div className="full-quran-download__confirm-actions">
            <button type="button" onClick={() => setConfirmation(null)}>{labels.keep}</button>
            <button type="button" className="is-confirm" onClick={confirmation === "remove" ? removeDownload : beginDownload}>
              {confirmation === "remove" ? labels.confirmRemove : labels.confirm}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
