import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAppActions, useAppLocale } from "../context/AppContext";
import { t } from "../i18n";
import { getAllBookmarks, removeBookmark } from "../services/storageService";
import { getSurah, toAr } from "../data/surahs";
import { Icon } from "./ui/icon";

export default function BookmarksModal() {
  const { dispatch, set } = useAppActions();
  const { lang } = useAppLocale();

  const [bookmarks, setBookmarks] = useState([]);

  const close = () =>
    dispatch({ type: "SET", payload: { bookmarksOpen: false } });

  useEffect(() => {
    getAllBookmarks().then((bms) => {
      setBookmarks(bms.sort((a, b) => b.createdAt - a.createdAt));
    });
  }, []);

  const goTo = (surah, ayah) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    close();
  };

  const handleRemove = async (surah, ayah) => {
    await removeBookmark(surah, ayah);
    setBookmarks((prev) => prev.filter((b) => b.id !== `${surah}:${ayah}`));
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
          <Dialog.Content
            className="modal !w-full !max-w-3xl !overflow-hidden !rounded-3xl !border !border-[var(--border)] !bg-[var(--bg-card)] !backdrop-blur-xl !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
            aria-labelledby="bookmarks-modal-title"
            onClick={(event) => event.stopPropagation()}
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              close();
            }}
            onInteractOutside={close}
          >
            <div className="modal-header !border-b !border-[var(--border)] !bg-[var(--bg-secondary)]">
              <div className="modal-title-stack">
                <div className="modal-kicker">
                  {lang === "fr"
                    ? "Bibliotheque"
                    : lang === "ar"
                      ? "المكتبة"
                      : "Library"}
                </div>
                <Dialog.Title asChild><h2 className="modal-title" id="bookmarks-modal-title">
                  <Icon name="bookmark" size={18} />
                  {t("bookmarks.title", lang)}
                </h2></Dialog.Title>
                <div className="modal-subtitle">
                  {lang === "fr"
                    ? "Retrouvez rapidement vos versets enregistres."
                    : lang === "ar"
                      ? "استرجع الآيات المحفوظة بسرعة."
                      : "Quick access to your saved verses."}
                </div>
              </div>
              <button
                className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.04] hover:!bg-white/[0.1]"
                onClick={close}
                type="button"
                aria-label={
                  lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"
                }
              >
                <Icon name="xmark" size={18} />
              </button>
            </div>

            <div className="modal-list !max-h-[70vh] !space-y-2 !overflow-auto !p-3 sm:!p-4">
              {bookmarks.length === 0 ? (
                <div className="modal-empty !rounded-2xl !border !border-dashed !border-white/15 !bg-white/[0.03] !p-6 !text-center">
                  <Icon name="bookmark" size={30} className="modal-empty-icon" />
                  <p style={{ margin: "0 0 0.3rem", fontWeight: 600 }}>
                    {t("bookmarks.empty", lang)}
                  </p>
                  <small style={{ opacity: 0.6, fontSize: "0.78rem" }}>
                    {lang === "fr"
                      ? "Appuyez sur l'etoile d'un verset pour l'enregistrer ici."
                      : lang === "ar"
                        ? "اضغط على نجمة أي آية لحفظها هنا."
                        : "Press the star on any verse to save it here."}
                  </small>
                </div>
              ) : (
                bookmarks.map((bm) => {
                  const s = getSurah(bm.surah);
                  return (
                    <div
                      key={bm.id}
                      className="modal-item-card !rounded-2xl !border !border-[var(--border)] !bg-white/[0.03] !p-2.5"
                    >
                      <button
                        className="modal-item-main !flex-1 !rounded-xl !px-2 !py-2 !text-left hover:!bg-white/[0.06]"
                        onClick={() => goTo(bm.surah, bm.ayah)}
                        type="button"
                      >
                        <span className="modal-item-ar">{s?.ar}</span>
                        <span className="modal-item-name !block !text-[0.8rem] !opacity-70">
                          {lang === "fr" ? s?.fr || s?.en : s?.en} -{" "}
                          {lang === "fr"
                            ? "Sourate"
                            : lang === "ar"
                              ? "سورة"
                              : "Surah"}{" "}
                          {lang === "ar" ? toAr(bm.surah) : bm.surah}
                        </span>
                        <span className="modal-item-meta !mb-0 !mt-1 !block">
                          {t("quran.ayah", lang)}{" "}
                          {lang === "ar" ? toAr(bm.ayah) : bm.ayah}
                        </span>
                      </button>
                      <button
                        className="modal-action-btn modal-delete-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-red-300/20 !bg-red-500/10 !text-red-200 hover:!bg-red-500/20"
                        onClick={() => handleRemove(bm.surah, bm.ayah)}
                        type="button"
                        aria-label={
                          lang === "fr"
                            ? "Supprimer ce favori"
                            : lang === "ar"
                              ? "حذف هذه العلامة"
                              : "Remove bookmark"
                        }
                      >
                        <Icon name="trash-alt" size={17} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
