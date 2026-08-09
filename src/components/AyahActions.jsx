import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "../context/AppContext";
import { t } from "../i18n";
import {
  addBookmark,
  getNote,
  isBookmarked,
  removeBookmark,
  saveNote,
} from "../services/storageService";
import audioService, { AudioService } from "../services/audioService";
import {
  ensureReciterForRiwaya,
  getReciter,
  isSurahOnlyReciter,
  isWarshVerifiedReciter,
} from "../data/reciters";
import { getSurah } from "../data/surahs";
import {
  addAyahToPlaylist,
  getAllPlaylists,
} from "../services/playlistService";
import { writeTextToClipboard } from "../services/verseShareService";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Play, Pause, Bookmark, BookmarkCheck, Copy, Check, Share2,
  PenSquare, Ellipsis, List, BookOpen,
  X, Zap, Layers, TriangleAlert, Music,
} from "lucide-react";

const SHEET_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function emitToast(type, message) {
  window.dispatchEvent(
    new CustomEvent("quran-toast", {
      detail: { type, message },
    }),
  );
}


export default function AyahActions({ surah, ayah, ayahData, translations = [], compact = false, layout = "horizontal" }) {
  const { dispatch, set } = useAppActions();
  const preferences = useAppSelector(
    (state) => ({
      lang: state.lang,
      reciter: state.reciter,
      riwaya: state.riwaya,
      warshStrictMode: state.warshStrictMode,
      displayMode: state.displayMode,
      showTranslation: state.showTranslation,
    }),
    shallowEqual,
  );
  const isCurrentAyah = useAppSelector(
    (state) =>
      state.currentPlayingAyah?.surah === Number(surah) &&
      state.currentPlayingAyah?.ayah === Number(ayah),
  );
  const isPlayingThisAyah = useAppSelector(
    (state) => state.isPlaying &&
      state.currentPlayingAyah?.surah === Number(surah) &&
      state.currentPlayingAyah?.ayah === Number(ayah),
  );
  const isTafsirActive = useAppSelector(
    (state) =>
      state.tafsirSidebarOpen &&
      state.tafsirSidebarVerse?.surah === Number(surah) &&
      state.tafsirSidebarVerse?.ayah === Number(ayah),
  );

  const renderPortal = (content) => {
    if (typeof document === "undefined") return null;
    const target = document.querySelector(".app-root") || document.body;
    return createPortal(content, target);
  };
  const {
    lang,
    reciter,
    riwaya,
    warshStrictMode,
    displayMode,
    showTranslation,
  } = preferences;

  const [bookmarked, setBookmarked] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistAdded, setPlaylistAdded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioErrTimerRef = useRef(null);
  const copiedTimerRef = useRef(null);
  const playlistTimerRef = useRef(null);
  const sheetRef = useRef(null);
  const sheetRestoreFocusRef = useRef(null);
  const optionsTriggerRef = useRef(null);
  const wasTafsirActiveRef = useRef(isTafsirActive);

  useEffect(() => {
    return () => {
      clearTimeout(audioErrTimerRef.current);
      clearTimeout(copiedTimerRef.current);
      clearTimeout(playlistTimerRef.current);
    };
  }, []);

  const surahInfo = useMemo(() => getSurah(surah), [surah]);
  const activeSheet = showPlaylistMenu
        ? "playlist"
        : showNote
          ? "note"
          : null;
  const sheetIdBase = `ayah-action-${surah}-${ayah}`;
  const closeSheetLabel =
    lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close";
  const noteFieldLabel =
    lang === "fr"
      ? "Note personnelle sur ce verset"
      : lang === "ar"
        ? "ملاحظة شخصية حول هذه الآية"
        : "Personal note about this ayah";

  useEffect(() => {
    let mounted = true;
    isBookmarked(surah, ayah).then((v) => { if (mounted) setBookmarked(v); });
    getNote(surah, ayah).then((note) => { if (mounted) setNoteText(note?.text || ""); });
    return () => { mounted = false; };
  }, [ayah, surah]);

  useEffect(() => {
    if (!activeSheet || typeof window === "undefined") return undefined;
    const isMobile = window.matchMedia?.("(max-width: 768px)")?.matches;
    if (!isMobile) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeSheet]);

  const closePanels = useCallback(() => {
    setShowNote(false);
    setShowPlaylistMenu(false);
  }, []);

  useEffect(() => {
    if (!activeSheet || typeof document === "undefined") return undefined;

    const sheet = sheetRef.current;
    if (!sheet) return undefined;

    sheetRestoreFocusRef.current = document.activeElement;
    const focusTimer = window.setTimeout(() => {
      const firstFocusable = sheet.querySelector(SHEET_FOCUSABLE_SELECTOR);
      (firstFocusable || sheet).focus();
    }, 80);

    const handleSheetKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanels();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        sheet.querySelectorAll(SHEET_FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true",
      );
      if (!focusable.length) {
        event.preventDefault();
        sheet.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleSheetKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleSheetKeyDown);
      const restoreTarget = sheetRestoreFocusRef.current;
      if (restoreTarget?.isConnected) restoreTarget.focus();
      sheetRestoreFocusRef.current = null;
    };
  }, [activeSheet, closePanels]);

  useEffect(() => {
    if (wasTafsirActiveRef.current && !isTafsirActive) {
      const focusFrame = window.requestAnimationFrame(() => {
        if (optionsTriggerRef.current?.isConnected) {
          optionsTriggerRef.current.focus();
        }
      });
      wasTafsirActiveRef.current = isTafsirActive;
      return () => window.cancelAnimationFrame(focusFrame);
    }
    wasTafsirActiveRef.current = isTafsirActive;
    return undefined;
  }, [isTafsirActive]);

  const toastText = useCallback(
    (fr, ar, en) =>
      lang === "ar" ? ar : lang === "fr" ? fr : en,
    [lang],
  );

  const toggleBookmark = async () => {
    if (bookmarked) {
      await removeBookmark(surah, ayah);
      setBookmarked(false);
      emitToast(
        "info",
        t("toast.bookmarkRemoved", lang),
      );
      return;
    }

    await addBookmark(surah, ayah);
    setBookmarked(true);
    emitToast(
      "success",
      t("toast.bookmarkAdded", lang),
    );
  };

  const handleSaveNote = async () => {
    const cleanText = noteText.trim();
    if (!cleanText) {
      closePanels();
      return;
    }

    await saveNote(surah, ayah, cleanText);
    closePanels();
    emitToast(
      "success",
      t("toast.noteSaved", lang),
    );
  };

  const playAyah = () => {
    if (!ayahData) return;

    setAudioError(false);
    const safeReciterId = ensureReciterForRiwaya(reciter, riwaya);
    const rec = getReciter(safeReciterId, riwaya);
    if (!rec) return;

    if (
      riwaya === "warsh" &&
      warshStrictMode &&
      !isWarshVerifiedReciter(rec)
    ) {
      setAudioError(true);
      clearTimeout(audioErrTimerRef.current);
      audioErrTimerRef.current = window.setTimeout(() => setAudioError(false), 2500);
      emitToast(
        "error",
        t("toast.reciterIncompatible", lang),
      );
      return;
    }

    // Try to play from active playlist to ensure continuous play
    let idx = -1;
    if (Array.isArray(audioService.playlist)) {
      idx = audioService.playlist.findIndex(
        (p) =>
          Number(p.surah) === Number(surah) &&
          (p.ayah === null || Number(p.ayah) === Number(ayah))
      );
    }

    if (idx >= 0) {
      audioService.loadAndPlay(idx).catch(() => {
        setAudioError(true);
        clearTimeout(audioErrTimerRef.current);
        audioErrTimerRef.current = window.setTimeout(() => setAudioError(false), 2500);
        emitToast(
          "error",
          t("toast.unableToPlay", lang),
        );
      });
      return;
    }

    const ayahInfo = {
      surah,
      numberInSurah: ayah,
      number: ayahData.number,
    };
    const url = AudioService.buildUrl(
      rec.cdn || rec.id,
      ayahInfo,
      rec.cdnType || "islamic",
    );

    if (isSurahOnlyReciter(rec)) {
      emitToast(
        "info",
        t("toast.warshFullSurah", lang),
      );
    }

    audioService.playSingle(url, { surah, ayah: isSurahOnlyReciter(rec) ? null : ayah }).catch(() => {
      setAudioError(true);
      clearTimeout(audioErrTimerRef.current);
      audioErrTimerRef.current = window.setTimeout(() => setAudioError(false), 2500);
      emitToast(
        "error",
        t("toast.unableToPlay", lang),
      );
    });
  };

  const showTranslationForAyah = () => {
    set({ showTranslation: true });
    emitToast(
      "info",
      t("toast.translationShown", lang),
    );
  };

  const copyVerseText = async (value, successMessage) => {
    if (!value) return false;

    const didCopy = await writeTextToClipboard(value);
    if (didCopy) {
      setCopied(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
      emitToast("success", successMessage);
      return true;
    }

    emitToast(
      "error",
      lang === "fr"
        ? "Impossible de copier le texte"
        : lang === "ar"
          ? "تعذّر نسخ النص"
          : "Unable to copy the text",
    );
    return false;
  };

  const copyText = async () => {
    await copyVerseText(
      ayahData?.text,
      t("toast.textCopied", lang),
    );
  };

  const openShareStudio = useCallback(() => {
    const translationText = Array.isArray(translations)
      ? translations.find((item) => item?.text)?.text || ""
      : "";
    closePanels();
    dispatch({
      type: "SET",
      payload: {
        currentSurah: Number(surah),
        currentAyah: Number(ayah),
        shareVerseDraft: {
          surah: Number(surah),
          ayah: Number(ayah),
          arabicText: ayahData?.text || "",
          translationText,
        },
        shareImageOpen: true,
      },
    });
  }, [ayah, ayahData?.text, closePanels, dispatch, surah, translations]);

  const openPlaylistMenu = async () => {
    if (!showPlaylistMenu) {
      const nextPlaylists = await getAllPlaylists();
      setPlaylists(nextPlaylists);
    }
    setShowNote(false);
    setShowPlaylistMenu((value) => !value);
  };

  const inlineIconButtonClass =
    "ayah-actions-inline__icon-btn inline-flex h-[2.06rem] w-[2.06rem] cursor-pointer items-center justify-center rounded-full border border-[rgba(var(--primary-rgb),0.22)] bg-[rgba(var(--primary-rgb),0.06)] text-[var(--text-secondary)] transition-[background,color,border-color] duration-150 ease-out hover:border-[rgba(var(--primary-rgb),0.4)] hover:bg-[rgba(var(--primary-rgb),0.16)] hover:text-[var(--text-primary)] max-[640px]:h-[2.14rem] max-[640px]:w-[2.14rem]";
  const inlineIconButtonActiveClass =
    "is-active border-[rgba(var(--primary-rgb),0.4)] bg-[rgba(var(--primary-rgb),0.16)] text-[var(--text-primary)]";

  const toggleTafsir = () => {
    if (isTafsirActive) {
      set({ tafsirSidebarOpen: false });
    } else {
      set({
        tafsirSidebarOpen: true,
        tafsirSidebarVerse: { surah: Number(surah), ayah: Number(ayah) }
      });
    }
  };

  return (
    <div className="ayah-actions" onClick={(event) => event.stopPropagation()}>
      {layout === "qcom-header-left" ? (
        <div className="flex items-center gap-1.5 select-none">
          {/* Play/Pause */}
          <button
            type="button"
            className={cn(
              "ayah-action ayah-action--play h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isPlayingThisAyah
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={() => {
              if (isCurrentAyah) {
                audioService.toggle();
              } else {
                playAyah();
              }
            }}
            aria-label={isPlayingThisAyah ? t("audio.pause", lang) : t("actions.listen", lang)}
            title={lang === "fr" ? "Écouter" : "Listen"}
          >
            {audioError ? <TriangleAlert size={13} /> : isPlayingThisAyah ? <Pause size={13} /> : <Play size={13} />}
          </button>

          {/* Bookmark */}
          <button
            type="button"
            className={cn(
              "ayah-action ayah-action--bookmark h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
              bookmarked
                ? "text-[var(--primary)]"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={toggleBookmark}
            aria-label={bookmarked ? (lang === "fr" ? "Retirer le favori" : lang === "ar" ? "إزالة المفضلة" : "Remove bookmark") : (lang === "fr" ? "Ajouter aux favoris" : lang === "ar" ? "أضف إلى المفضلة" : "Add bookmark")}
            title={lang === "fr" ? "Favori" : "Bookmark"}
          >
            {bookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          </button>
        </div>
      ) : layout === "qcom-header-right" ? (
        <div className="flex items-center gap-1.5 select-none">
          {/* Secondary actions live in one stable menu. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
          <button
            ref={optionsTriggerRef}
            type="button"
            className={cn(
              "ayah-action ayah-action--options h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
              showPlaylistMenu
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            aria-label={lang === "fr" ? "Options du verset" : lang === "ar" ? "خيارات الآية" : "Verse options"}
            title="Options"
          >
            <Ellipsis size={13} />
          </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {lang === "fr" ? "Options du verset" : lang === "ar" ? "خيارات الآية" : "Verse options"}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={copyText}>
                <Copy size={13} className="text-[var(--primary)]" />
                <span>{lang === "fr" ? "Copier le verset" : lang === "ar" ? "نسخ الآية" : "Copy verse"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={openShareStudio}
              >
                <Share2 size={13} className="text-[var(--primary)]" />
                <span>{lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Share"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setShowPlaylistMenu(false);
                  setShowNote(true);
                }}
              >
                <PenSquare size={13} className="text-[var(--primary)]" />
                <span>{lang === "fr" ? "Ajouter une note" : lang === "ar" ? "إضافة ملاحظة" : "Add note"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openPlaylistMenu}>
                <List size={13} className="text-[var(--primary)]" />
                <span>{lang === "fr" ? "Playlists / Listes" : lang === "ar" ? "قوائم التشغيل" : "Playlists"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTafsir}>
                <BookOpen size={13} className="text-[var(--primary)]" />
                <span>{lang === "fr" ? "Tafsir" : lang === "ar" ? "تفسير" : "Tafsir"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : layout === "qcom-footer" ? (
        <div className="qcom-verse-card-footer flex flex-wrap items-center gap-2 text-xs select-none">
          {/* Play/Pause */}
          <button
            type="button"
            className={cn(
              "qcom-verse-card-footer-btn flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)] text-muted-foreground transition-all cursor-pointer",
              isPlayingThisAyah && "text-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] font-semibold"
            )}
            onClick={() => {
              if (isCurrentAyah) {
                audioService.toggle();
              } else {
                playAyah();
              }
            }}
            title={isPlayingThisAyah ? "Pause" : (lang === "fr" ? "Écouter" : "Listen")}
          >
            {audioError ? <TriangleAlert size={12} /> : isPlayingThisAyah ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlayingThisAyah ? (lang === "fr" ? "Pause" : "Pause") : (lang === "fr" ? "Écouter" : "Play")}</span>
          </button>

          {/* Tafsir */}
          <button
            type="button"
            className={cn(
              "qcom-verse-card-footer-btn flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)] text-muted-foreground transition-all cursor-pointer",
              isTafsirActive && "text-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] font-semibold"
            )}
            onClick={toggleTafsir}
          >
            <BookOpen size={12} />
            <span>Tafsir</span>
          </button>

          {/* Bookmark */}
          <button
            type="button"
            className={cn(
              "qcom-verse-card-footer-btn flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)] text-muted-foreground transition-all cursor-pointer",
              bookmarked && "text-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] font-semibold"
            )}
            onClick={toggleBookmark}
          >
            {bookmarked ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
            <span>{bookmarked ? (lang === "fr" ? "Favori" : "Bookmarked") : (lang === "fr" ? "Favori" : "Bookmark")}</span>
          </button>

          {/* Copy */}
          <button
            type="button"
            className={cn(
              "qcom-verse-card-footer-btn flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)] text-muted-foreground transition-all cursor-pointer",
              copied && "text-green-500 bg-green-500/10 font-semibold"
            )}
            onClick={copyText}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? (lang === "fr" ? "Copié" : "Copied") : (lang === "fr" ? "Copier" : "Copy")}</span>
          </button>

          {/* Share */}
          <button
            type="button"
            className="qcom-verse-card-footer-btn flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)] text-muted-foreground transition-all cursor-pointer"
            onClick={openShareStudio}
          >
            <Share2 size={12} />
            <span>{lang === "fr" ? "Partager" : "Share"}</span>
          </button>

          {/* Note */}
          <button
            type="button"
            className={cn(
              "qcom-verse-card-footer-btn flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)] text-muted-foreground transition-all cursor-pointer",
              (showNote || noteText.trim()) && "text-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] font-semibold"
            )}
            onClick={() => {
              setShowPlaylistMenu(false);
              setShowNote((value) => !value);
            }}
          >
            <PenSquare size={12} />
            <span>{noteText.trim() ? (lang === "fr" ? "Voir la note" : "View note") : "Note"}</span>
          </button>

          {/* Playlists */}
          <button
            type="button"
            className={cn(
              "qcom-verse-card-footer-btn flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)] text-muted-foreground transition-all cursor-pointer",
              showPlaylistMenu && "text-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] font-semibold"
            )}
            onClick={openPlaylistMenu}
          >
            <List size={12} />
            <span>Playlists</span>
          </button>

        </div>
      ) : layout === "side-mobile-row" ? (
        <div className="flex items-center gap-1.5 select-none">
          {/* Play/Pause */}
          <button
            type="button"
            className={cn(
              "w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isPlayingThisAyah
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={() => {
              if (isCurrentAyah) {
                audioService.toggle();
              } else {
                playAyah();
              }
            }}
            aria-label={isPlayingThisAyah ? t("audio.pause", lang) : t("actions.listen", lang)}
            title={isPlayingThisAyah ? "Pause" : (lang === "fr" ? "Écouter" : "Listen")}
          >
            {audioError ? <TriangleAlert size={12} /> : isPlayingThisAyah ? <Pause size={12} /> : <Play size={12} />}
          </button>

          {/* Tafsir */}
          <button
            type="button"
            className={cn(
              "w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isTafsirActive
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={toggleTafsir}
            aria-label={lang === "fr" ? "Tafsir" : lang === "ar" ? "تفسير" : "Tafsir"}
            title="Tafsir"
          >
            <BookOpen size={12} />
          </button>

          {/* Bookmark */}
          <button
            type="button"
            className={cn(
              "w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer",
              bookmarked
                ? "text-[var(--primary)]"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={toggleBookmark}
            aria-label={bookmarked ? (lang === "fr" ? "Retirer le favori" : lang === "ar" ? "إزالة المفضلة" : "Remove bookmark") : (lang === "fr" ? "Ajouter aux favoris" : lang === "ar" ? "أضف إلى المفضلة" : "Add bookmark")}
            title={lang === "fr" ? "Favori" : "Bookmark"}
          >
            {bookmarked ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          </button>

          {/* Copy */}
          <button
            type="button"
            className={cn(
              "w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer",
              copied
                ? "text-green-500"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={copyText}
            aria-label={copied ? (lang === "fr" ? "Copié !" : lang === "ar" ? "تم النسخ!" : "Copied!") : (lang === "fr" ? "Copier le verset" : lang === "ar" ? "نسخ الآية" : "Copy verse")}
            title={lang === "fr" ? "Copier" : "Copy"}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>

          {/* Share */}
          <button
            type="button"
            className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)] transition-all cursor-pointer"
            onClick={openShareStudio}
            aria-label={lang === "fr" ? "Partager ce verset" : lang === "ar" ? "مشاركة الآية" : "Share verse"}
            title={lang === "fr" ? "Partager" : "Share"}
          >
            <Share2 size={12} />
          </button>
        </div>
      ) : layout === "side" ? (
        <div className="flex flex-col items-center gap-3 select-none">
          {/* Play/Pause */}
          <button
            type="button"
            className={cn(
              "h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isPlayingThisAyah
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={() => {
              if (isCurrentAyah) {
                audioService.toggle();
              } else {
                playAyah();
              }
            }}
            aria-label={isPlayingThisAyah ? t("audio.pause", lang) : t("actions.listen", lang)}
            title={isPlayingThisAyah ? "Pause" : (lang === "fr" ? "Écouter" : "Listen")}
          >
            {audioError ? <TriangleAlert size={13} /> : isPlayingThisAyah ? <Pause size={13} /> : <Play size={13} />}
          </button>

          {/* Tafsir */}
          <button
            type="button"
            className={cn(
              "h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isTafsirActive
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={toggleTafsir}
            aria-label={lang === "fr" ? "Tafsir" : lang === "ar" ? "تفسير" : "Tafsir"}
            title="Tafsir"
          >
            <BookOpen size={13} />
          </button>

          {/* Bookmark */}
          <button
            type="button"
            className={cn(
              "h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
              bookmarked
                ? "text-[var(--primary)]"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={toggleBookmark}
            aria-label={bookmarked ? (lang === "fr" ? "Retirer le favori" : lang === "ar" ? "إزالة المفضلة" : "Remove bookmark") : (lang === "fr" ? "Ajouter aux favoris" : lang === "ar" ? "أضف إلى المفضلة" : "Add bookmark")}
            title={lang === "fr" ? "Favori" : "Bookmark"}
          >
            {bookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          </button>

          {/* Copy */}
          <button
            type="button"
            className={cn(
              "h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
              copied
                ? "text-green-500"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={copyText}
            aria-label={copied ? (lang === "fr" ? "Copié !" : lang === "ar" ? "تم النسخ!" : "Copied!") : (lang === "fr" ? "Copier le verset" : lang === "ar" ? "نسخ الآية" : "Copy verse")}
            title={lang === "fr" ? "Copier" : "Copy"}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>

          {/* Share */}
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)] transition-all cursor-pointer"
            onClick={openShareStudio}
            aria-label={lang === "fr" ? "Partager ce verset" : lang === "ar" ? "مشاركة الآية" : "Share verse"}
            title={lang === "fr" ? "Partager" : "Share"}
          >
            <Share2 size={13} />
          </button>
        </div>
      ) : compact ? (
        <div className="ayah-actions-inline flex flex-col gap-[0.48rem] rounded-[0.82rem] border border-[rgba(var(--primary-rgb),0.12)] bg-[rgba(var(--primary-rgb),0.04)] px-[0.68rem] py-[0.62rem] max-[640px]:px-[0.54rem] max-[640px]:py-[0.54rem]">
          <div className="ayah-actions-inline__meta flex items-center justify-between gap-[0.6rem] font-[var(--font-ui)] leading-[1.15] max-[640px]:gap-[0.4rem]">
            <span className="ayah-actions-inline__ref text-[0.74rem] font-bold tracking-[0.04em] text-[var(--text-muted)]">
              {surah}:{ayah}
            </span>
            {displayMode !== "page" && (
              <span className="ayah-actions-inline__name text-[0.76rem] text-[var(--text-secondary)] opacity-[0.84] max-[640px]:text-[0.7rem]">
                {lang === "fr"
                  ? surahInfo?.fr || surahInfo?.en
                  : lang === "ar"
                    ? surahInfo?.ar
                    : surahInfo?.en}
              </span>
            )}
          </div>

          <div className="ayah-actions-inline__icons flex justify-start gap-[0.34rem]">
            <button
              type="button"
              className={cn(
                inlineIconButtonClass,
                isPlayingThisAyah && inlineIconButtonActiveClass,
              )}
              onClick={() => {
                if (isCurrentAyah) {
                  audioService.toggle();
                } else {
                  playAyah();
                }
              }}
              title={isPlayingThisAyah ? "Pause" : t("actions.listen", lang)}
              aria-label={isPlayingThisAyah ? t("audio.pause", lang) : t("actions.listen", lang)}
            >
              {audioError ? <TriangleAlert size={13} /> : isPlayingThisAyah ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              type="button"
              className={cn(
                inlineIconButtonClass,
                bookmarked && inlineIconButtonActiveClass,
              )}
              onClick={toggleBookmark}
              title={bookmarked ? (lang === "fr" ? "Retirer le favori" : lang === "ar" ? "إزالة المفضلة" : "Remove bookmark") : (lang === "fr" ? "Ajouter aux favoris" : lang === "ar" ? "أضف إلى المفضلة" : "Add bookmark")}
              aria-label={lang === "fr" ? "Favori" : lang === "ar" ? "مفضلة" : "Bookmark"}
            >
              <Bookmark size={13} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  ref={optionsTriggerRef}
                  type="button"
                  className={inlineIconButtonClass}
                  title={lang === "fr" ? "Plus" : lang === "ar" ? "المزيد" : "More"}
                  aria-label={lang === "fr" ? "Plus d’actions" : lang === "ar" ? "المزيد من الإجراءات" : "More actions"}
                >
                  <Ellipsis size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={copyText}><Copy size={13} /><span>{lang === "fr" ? "Copier" : lang === "ar" ? "نسخ" : "Copy"}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={openShareStudio}><Share2 size={13} /><span>{lang === "fr" ? "Partager en image" : lang === "ar" ? "مشاركة كصورة" : "Share as image"}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNote(true)}><PenSquare size={13} /><span>{lang === "fr" ? "Note" : lang === "ar" ? "ملاحظة" : "Note"}</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openPlaylistMenu}><List size={13} /><span>{lang === "fr" ? "Liste d’écoute" : lang === "ar" ? "قائمة الاستماع" : "Listening list"}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTafsir}><BookOpen size={13} /><span>{lang === "ar" ? "تفسير" : "Tafsir"}</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      ) : (
        <div className="ayah-actions__surface ayah-actions__surface--modal">
          <div className="ayah-actions__summary">
            <span className="ayah-actions__kicker">
              <Zap size={13} aria-hidden="true" />
              {lang === "fr"
                ? "Choisir une action"
                : lang === "ar"
                  ? "اختر إجراءً"
                  : "Choose an action"}
            </span>

            <div className="ayah-actions__badges">
              <span className={cn("ayah-actions__badge", bookmarked && "is-on")}>
                <Bookmark size={12} aria-hidden="true" />
                {bookmarked
                  ? lang === "fr"
                    ? "Favori"
                    : lang === "ar"
                      ? "مفضلة"
                      : "Saved"
                  : lang === "fr"
                    ? "Non enregistré"
                    : lang === "ar"
                      ? "غير محفوظة"
                      : "Not saved"}
              </span>
            </div>
          </div>

          <div className="ayah-actions__grid">
            <button
              type="button"
              className={cn("ayah-action-card ayah-action-card--play", isPlayingThisAyah && "is-active")}
              onClick={() => isCurrentAyah ? audioService.toggle() : playAyah()}
              aria-pressed={isPlayingThisAyah || undefined}
            >
              <span className="ayah-action-card__icon">
                {audioError ? <TriangleAlert size={14} /> : isPlayingThisAyah ? <Pause size={14} /> : <Play size={14} />}
              </span>
              <span className="ayah-action-card__content"><span className="ayah-action-card__label">{isPlayingThisAyah ? t("audio.pause", lang) : t("actions.listen", lang)}</span></span>
            </button>
            <button
              type="button"
              className={cn("ayah-action-card", bookmarked && "is-active")}
              onClick={toggleBookmark}
              aria-pressed={bookmarked}
            >
              <span className="ayah-action-card__icon">{bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}</span>
              <span className="ayah-action-card__content"><span className="ayah-action-card__label">{lang === "fr" ? "Favori" : lang === "ar" ? "مفضلة" : "Favorite"}</span></span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button ref={optionsTriggerRef} type="button" className="ayah-action-card" aria-label={lang === "fr" ? "Plus d’actions" : lang === "ar" ? "المزيد من الإجراءات" : "More actions"}>
                  <span className="ayah-action-card__icon"><Ellipsis size={14} /></span>
                  <span className="ayah-action-card__content"><span className="ayah-action-card__label">{lang === "fr" ? "Plus" : lang === "ar" ? "المزيد" : "More"}</span></span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyText}><Copy size={13} /><span>{lang === "fr" ? "Copier" : lang === "ar" ? "نسخ" : "Copy"}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={openShareStudio}><Share2 size={13} /><span>{lang === "fr" ? "Partager en image" : lang === "ar" ? "مشاركة كصورة" : "Share as image"}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNote(true)}><PenSquare size={13} /><span>{lang === "fr" ? "Note" : lang === "ar" ? "ملاحظة" : "Note"}</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openPlaylistMenu}><List size={13} /><span>{lang === "fr" ? "Liste d’écoute" : lang === "ar" ? "قائمة الاستماع" : "Listening list"}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTafsir}><BookOpen size={13} /><span>{lang === "ar" ? "تفسير" : "Tafsir"}</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {activeSheet && renderPortal(
        <div
          className="ayah-action-sheet-backdrop"
          aria-hidden="true"
          onClick={closePanels}
        />
      )}

      {showPlaylistMenu && renderPortal(
        <div
          ref={sheetRef}
          className="ayah-action-sheet ayah-action-sheet--playlist"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${sheetIdBase}-playlist-title`}
          tabIndex={-1}
        >
          <div className="ayah-action-sheet__header">
            <div>
              <div className="ayah-action-sheet__eyebrow">
                {lang === "fr"
                  ? "Hub audio"
                  : lang === "ar"
                    ? "مركز الصوت"
                    : "Audio hub"}
              </div>
              <h2
                id={`${sheetIdBase}-playlist-title`}
                className="ayah-action-sheet__title"
              >
                {lang === "fr"
                  ? "Ajouter à une playlist"
                  : lang === "ar"
                    ? "أضف إلى قائمة"
                    : "Add to a playlist"}
              </h2>
            </div>
            <button
              type="button"
              className="ayah-action-sheet__close"
              onClick={closePanels}
              aria-label={closeSheetLabel}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="ayah-action-sheet__empty">
              {lang === "fr"
                ? "Aucune playlist encore. Créez-en une depuis le panneau Playlists."
                : lang === "ar"
                  ? "لا توجد قوائم بعد. أنشئ قائمة من لوحة القوائم."
                  : "No playlist yet. Create one from the Playlists panel."}
            </div>
          ) : (
            <div className="ayah-actions__sheet-grid">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  className="ayah-actions__playlist-btn"
                  onClick={async () => {
                    await addAyahToPlaylist(
                      playlist.id,
                      surah,
                      ayah,
                      ayahData?.text || "",
                    );
                    setPlaylistAdded(true);
                    closePanels();
                    emitToast(
                      "success",
                      t("toast.ayahAddedToPlaylist", lang),
                    );
                    window.setTimeout(() => setPlaylistAdded(false), 1800);
                  }}
                >
                  <Music size={13} />
                  <span>
                    {playlist.name} ({playlist.ayahs.length})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showNote && renderPortal(
        <div
          ref={sheetRef}
          className="ayah-action-sheet ayah-action-sheet--note"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${sheetIdBase}-note-title`}
          tabIndex={-1}
        >
          <div className="ayah-action-sheet__header">
            <div>
              <div className="ayah-action-sheet__eyebrow">
                {lang === "fr"
                  ? "Note de meditation"
                  : lang === "ar"
                    ? "ملاحظة تدبر"
                    : "Reflection note"}
              </div>
              <h2
                id={`${sheetIdBase}-note-title`}
                className="ayah-action-sheet__title"
              >
                {lang === "fr"
                  ? "Ecrire sur cette ayah"
                  : lang === "ar"
                    ? "اكتب حول cette الآية"
                    : "Write on this ayah"}
              </h2>
            </div>
            <button
              type="button"
              className="ayah-action-sheet__close"
              onClick={closePanels}
              aria-label={closeSheetLabel}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {ayahData?.text ? (
            <div className="ayah-action-sheet__verse-preview" dir="rtl" lang="ar">
              <span className="ayah-action-sheet__verse-preview-ref">
                {surah}:{ayah}
              </span>
              <p className="ayah-action-sheet__verse-preview-text">
                {ayahData.text}
              </p>
            </div>
          ) : null}

          <label className="sr-only" htmlFor={`${sheetIdBase}-note`}>
            {noteFieldLabel}
          </label>
          <textarea
            id={`${sheetIdBase}-note`}
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder={t("notes.placeholder", lang)}
            className="ayah-actions__textarea"
            rows={4}
          />

          <div className="ayah-action-sheet__actions">
            <button
              type="button"
              className="ayah-action-sheet__btn"
              onClick={closePanels}
            >
              {lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"}
            </button>
            <button
              type="button"
              className="ayah-action-sheet__btn ayah-action-sheet__btn--primary"
              onClick={handleSaveNote}
            >
              {t("notes.save", lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
