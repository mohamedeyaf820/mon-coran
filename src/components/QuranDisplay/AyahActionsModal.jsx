import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import AyahActions from "../AyahActions";
import { cn } from "../../lib/utils";
import { useAppLocale } from "../../context/AppContext";
import { t } from "../../i18n";
import "../../styles/ayah-actions-modal.css";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function AyahActionsModal({
  activeAyah,
  onClose,
  surah,
  ayahData,
  translations = [],
  quietBackdrop = false,
}) {
  const { lang } = useAppLocale();
  const dialogRef = useRef(null);
  const titleId = `aam-title-${activeAyah}`;
  const verseNumber = ayahData?.numberInSurah ?? activeAyah;
  const modalTitle =
    lang === "fr"
      ? "Actions du verset"
      : lang === "ar"
        ? "إجراءات الآية"
        : "Verse actions";

  // Focus trap + Escape
  useEffect(() => {
    if (!activeAyah) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const prevFocus = document.activeElement;
    const firstFocusable = dialog.querySelector(FOCUSABLE);
    firstFocusable?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const focusables = [...dialog.querySelectorAll(FOCUSABLE)];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus();
    };
  }, [activeAyah, onClose]);

  if (!activeAyah) return null;

  const portalTarget =
    typeof document === "undefined"
      ? null
      : document.querySelector(".app-root") || document.body;

  if (!portalTarget) return null;

  return createPortal(
    <div
      className={cn(
        "ayah-actions-modal",
        quietBackdrop
          ? "ayah-actions-modal--quiet"
          : "ayah-actions-modal--dimmed",
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={dialogRef}
        className="ayah-actions-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="ayah-actions-modal__handle" aria-hidden="true" />
        <div className="ayah-actions-modal__header">
          <div className="ayah-actions-modal__heading">
            <h2 id={titleId} className="ayah-actions-modal__title">
              <span className="ayah-actions-modal__ref">
                {surah}:{verseNumber}
              </span>
              <span>{modalTitle}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ayah-actions-modal__close"
            aria-label={t("audio.close", lang)}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="ayah-actions-modal__body">
          <AyahActions
            surah={surah}
            ayah={verseNumber}
            ayahData={ayahData}
            translations={translations}
          />
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
