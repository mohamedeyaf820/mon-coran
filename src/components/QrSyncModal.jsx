import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  QrCode,
  Copy,
  Check,
  Download,
  Upload,
  Camera,
  X,
  Loader2,
  BookOpen,
  Bookmark,
  StickyNote,
} from "lucide-react";
import { t } from "../i18n";
import { confirmAction } from "../services/interactionService.js";
import {
  buildSyncPayload,
  encodeSyncToken,
  buildSyncUrl,
  generateQrSvg,
  decodeSyncToken,
  applySyncPayload,
} from "../services/qrSyncService";

export default function QrSyncModal({ open = true, onClose, lang = "fr" }) {
  const [activeTab, setActiveTab] = useState("export"); // "export" | "import"
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [qrSvg, setQrSvg] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [syncUrl, setSyncUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);
  const importingRef = useRef(false);
  const reloadTimerRef = useRef(null);
  const cameraGenerationRef = useRef(0);
  const streamRef = useRef(null);

  // Import state
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState(null); // null | "success" | "error"
  const [importSummary, setImportSummary] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Prepare export QR on mount or tab switch
  useEffect(() => {
    let mounted = true;
    if (activeTab === "export" && open) {
      setLoading(true);
      setSyncUrl("");
      setQrSvg("");
      setQrDataUrl("");
      buildSyncPayload({ includeNotes })
        .then((data) => {
          if (!mounted) return;
          setPayload(data);
          const token = encodeSyncToken(data);
          const url = buildSyncUrl(token);
          setSyncUrl(url);
          const svg = generateQrSvg(url, {
            errorCorrectionLevel: "M",
            cellMargin: 2,
          });
          setQrSvg(svg);
          setQrDataUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
        })
        .catch(() => {
          if (mounted) {
            setQrSvg("");
            setQrDataUrl("");
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [activeTab, open, includeNotes]);

  // Clean up scanner on unmount or tab switch
  const stopCamera = useCallback(() => {
    cameraGenerationRef.current += 1;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (activeTab !== "import" || !open) {
      stopCamera();
    }
    return stopCamera;
  }, [activeTab, open, stopCamera]);

  useEffect(() => () => clearTimeout(reloadTimerRef.current), []);

  const handleCopyLink = async () => {
    if (!syncUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(syncUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = syncUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQr = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mushafplus-sync-${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyImport = async (textToImport) => {
    const raw = (textToImport || importText).trim();
    if (!raw || importingRef.current) return;
    importingRef.current = true;
    try {
      const parsed = decodeSyncToken(raw);
      const confirmed = await confirmAction({
        title: t("export.qrApply", lang),
        message: `${t("export.qrDetectPrompt", lang)}\n${parsed.rw} · ${parsed.pos.s}:${parsed.pos.a} · ${parsed.bm.length} / ${parsed.nt.length}`,
        confirmLabel: t("export.qrApply", lang),
        cancelLabel: t("share.close", lang),
      });
      if (!confirmed) return;
      const result = await applySyncPayload(parsed);
      setImportStatus("success");
      setImportSummary(result);
      reloadTimerRef.current = setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setImportStatus("error");
    } finally {
      importingRef.current = false;
    }
  };

  const startCamera = async () => {
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
      return;
    }
    const generation = ++cameraGenerationRef.current;
    try {
      setIsScanning(true);
      setImportStatus(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (generation !== cameraGenerationRef.current || !videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (generation !== cameraGenerationRef.current) return;

      const barcodeDetector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      let detecting = false;
      scanIntervalRef.current = setInterval(async () => {
        if (detecting || !videoRef.current || videoRef.current.readyState < 2) return;
        detecting = true;
        try {
          const codes = await barcodeDetector.detect(videoRef.current);
          if (generation === cameraGenerationRef.current && codes && codes.length > 0) {
            const raw = codes[0].rawValue;
            stopCamera();
            setImportText(raw);
          }
        } catch {
          // ignore scan frame errors
        } finally {
          detecting = false;
        }
      }, 400);
    } catch {
      stopCamera();
    }
  };

  const hasBarcodeDetector =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay qr-sync-overlay" />
        <Dialog.Content
          className="qr-sync-modal"
          dir={lang === "ar" ? "rtl" : "ltr"}
          aria-labelledby="qr-sync-title"
        >
          <header className="qr-sync-modal__header">
            <div className="qr-sync-modal__title-box">
              <span className="qr-sync-modal__badge">
                <QrCode size={18} aria-hidden="true" />
              </span>
              <div>
                <Dialog.Title id="qr-sync-title" className="qr-sync-modal__title">
                  {t("export.qrSync", lang)}
                </Dialog.Title>
                <p className="qr-sync-modal__subtitle">
                  {t("export.qrDesc", lang)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="qr-sync-modal__close"
              onClick={onClose}
              aria-label={t("share.close", lang)}
            >
              <X size={18} />
            </button>
          </header>

          <nav className="qr-sync-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "export"}
              className={`qr-sync-tab ${activeTab === "export" ? "is-active" : ""}`}
              onClick={() => setActiveTab("export")}
            >
              <QrCode size={16} aria-hidden="true" />
              <span>{t("export.qrGenerate", lang)}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "import"}
              className={`qr-sync-tab ${activeTab === "import" ? "is-active" : ""}`}
              onClick={() => setActiveTab("import")}
            >
              <Upload size={16} aria-hidden="true" />
              <span>{t("export.qrScan", lang)}</span>
            </button>
          </nav>

          <div className="qr-sync-modal__body">
            {activeTab === "export" ? (
              <div className="qr-sync-export-panel">
                <p className="qr-sync-instructions">{t("export.qrPrivacy", lang)}</p>
                <label className="qr-sync-instructions">
                  <input type="checkbox" checked={includeNotes} onChange={event => setIncludeNotes(event.target.checked)} />
                  {t("export.qrIncludeNotes", lang)}
                </label>
                {loading ? (
                  <div className="qr-sync-loading">
                    <Loader2 size={28} className="animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="qr-sync-card">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR Code"
                          width={192}
                          height={192}
                          className="qr-sync-image"
                        />
                      ) : <p role="status">{t("export.qrTooLarge", lang)}</p>}
                    </div>

                    <div className="qr-sync-meta-grid">
                      <div className="qr-sync-meta-pill">
                        <BookOpen size={15} aria-hidden="true" />
                        <span>
                          {lang === "fr"
                            ? `Sourate ${payload?.pos?.s || 1}:${payload?.pos?.a || 1} • P.${payload?.pos?.p || 1}`
                            : lang === "ar"
                              ? `سورة ${payload?.pos?.s || 1}:${payload?.pos?.a || 1} • ص.${payload?.pos?.p || 1}`
                              : `Surah ${payload?.pos?.s || 1}:${payload?.pos?.a || 1} • P.${payload?.pos?.p || 1}`}
                        </span>
                      </div>
                      <div className="qr-sync-meta-pill">
                        <Bookmark size={15} aria-hidden="true" />
                        <span>
                          {payload?.bm?.length || 0}{" "}
                          {lang === "fr"
                            ? "favoris"
                            : lang === "ar"
                              ? "مفضلة"
                              : "bookmarks"}
                        </span>
                      </div>
                      <div className="qr-sync-meta-pill">
                        <StickyNote size={15} aria-hidden="true" />
                        <span>
                          {payload?.nt?.length || 0}{" "}
                          {lang === "fr" ? "notes" : lang === "ar" ? "ملاحظة" : "notes"}
                        </span>
                      </div>
                    </div>

                    <p className="qr-sync-instructions">
                      {t("export.qrScanPrompt", lang)}
                    </p>

                    <div className="qr-sync-actions">
                      <button
                        type="button"
                        className="qr-sync-btn qr-sync-btn--primary"
                        onClick={handleCopyLink}
                        disabled={!syncUrl}
                      >
                        {copied ? (
                          <>
                            <Check size={16} aria-hidden="true" />
                            <span>{t("share.copied", lang)}</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} aria-hidden="true" />
                            <span>{t("export.qrCopyLink", lang)}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="qr-sync-btn"
                        onClick={handleDownloadQr}
                        disabled={!qrSvg}
                      >
                        <Download size={16} aria-hidden="true" />
                        <span>{t("export.qrDownload", lang)}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="qr-sync-import-panel">
                {hasBarcodeDetector && !isScanning ? (
                  <button
                    type="button"
                    className="qr-sync-btn qr-sync-btn--camera"
                    onClick={startCamera}
                  >
                    <Camera size={18} aria-hidden="true" />
                    <span>
                      {lang === "fr"
                        ? "Scanner avec la caméra"
                        : lang === "ar"
                          ? "مسح بالكاميرا"
                          : "Scan with camera"}
                    </span>
                  </button>
                ) : null}

                {isScanning ? (
                  <div className="qr-sync-camera-box">
                    <video
                      ref={videoRef}
                      className="qr-sync-video"
                      playsInline
                      muted
                    />
                    <button
                      type="button"
                      className="qr-sync-btn qr-sync-btn--cancel"
                      onClick={stopCamera}
                    >
                      <X size={16} aria-hidden="true" />
                      <span>{t("share.close", lang)}</span>
                    </button>
                  </div>
                ) : null}

                <div className="qr-sync-input-box">
                  <label htmlFor="qr-import-input" className="qr-sync-label">
                    {t("export.qrImportTitle", lang)}
                  </label>
                  <textarea
                    id="qr-import-input"
                    rows={4}
                    className="qr-sync-textarea"
                    placeholder={t("export.qrImportPlaceholder", lang)}
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      if (importStatus) setImportStatus(null);
                    }}
                  />
                  <button
                    type="button"
                    className="qr-sync-btn qr-sync-btn--primary"
                    disabled={!importText.trim()}
                    onClick={() => handleApplyImport()}
                  >
                    <Upload size={16} aria-hidden="true" />
                    <span>{t("export.qrApply", lang)}</span>
                  </button>
                </div>

                {importStatus === "success" ? (
                  <div className="qr-sync-feedback is-success" role="status">
                    <Check size={18} aria-hidden="true" />
                    <span>
                      {t("export.qrSuccess", lang)}{" "}
                      {importSummary
                        ? `(${importSummary.bookmarks} bookmarks, ${importSummary.notes} notes)`
                        : ""}
                    </span>
                  </div>
                ) : null}

                {importStatus === "error" ? (
                  <div className="qr-sync-feedback is-error" role="alert">
                    <X size={18} aria-hidden="true" />
                    <span>{t("export.qrInvalid", lang)}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
