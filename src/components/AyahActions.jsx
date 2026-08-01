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
import {
  getMemorizationLevel,
  setMemorizationLevel,
} from "../services/memorizationService";
import { getVerseTafsir } from "../services/quranComStudyService";
import { openExternalUrl } from "../lib/security";
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
  PenSquare, Ellipsis, List, Repeat, Pin, BookOpen, Languages,
  Feather, X, Mail, Image, Wand2, Zap, Star, AlertTriangle,
  MessageCircle, Layers, TriangleAlert, Music, Headphones,
  Quote, Lightbulb,
} from "lucide-react";
import { Icon } from "./ui/icon";

function faIcon(key) {
  const map = {
    "fa-triangle-exclamation": TriangleAlert,
    "fa-play": Play,
    "fa-pause": Pause,
    "fa-star": Star,
    "fa-repeat": Repeat,
    "fa-check": Check,
    "fa-share-nodes": Share2,
    "fa-thumbtack": Pin,
    "fa-list": List,
    "fa-language": Languages,
    "fa-book-open": BookOpen,
    "fa-lightbulb": Lightbulb,
    "fa-feather": Feather,
    "pen-line": PenSquare,
    "fa-headphones": Headphones,
    "fa-quote-right": Quote,
  };
  const Comp = map[key];
  return Comp ? <Comp size={14} aria-hidden="true" /> : null;
}

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

const EMPTY_PINNED_AYAHS = Object.freeze([]);

export default function AyahActions({ surah, ayah, ayahData, compact = false, layout = "horizontal" }) {
  const { dispatch, set } = useAppActions();
  const preferences = useAppSelector(
    (state) => ({
      lang: state.lang,
      reciter: state.reciter,
      riwaya: state.riwaya,
      warshStrictMode: state.warshStrictMode,
      displayMode: state.displayMode,
      memPause: state.memPause,
      memRepeatCount: state.memRepeatCount,
      showTranslation: state.showTranslation,
    }),
    shallowEqual,
  );
  const pinnedAyahs = useAppSelector((state) =>
    Array.isArray(state.pinnedAyahs) ? state.pinnedAyahs : EMPTY_PINNED_AYAHS,
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
    memPause,
    memRepeatCount,
    showTranslation,
  } = preferences;

  const [bookmarked, setBookmarked] = useState(false);
  const [memoLevel, setMemoLevel] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showStudy, setShowStudy] = useState(false);
  const [studyTab, setStudyTab] = useState("tafsir");
  const [tafsirState, setTafsirState] = useState({
    key: null,
    status: "idle",
    data: null,
    error: null,
  });
  const tafsirFetchedKeyRef = useRef(null);
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

  useEffect(() => {
    return () => {
      clearTimeout(audioErrTimerRef.current);
      clearTimeout(copiedTimerRef.current);
      clearTimeout(playlistTimerRef.current);
    };
  }, []);

  const surahInfo = useMemo(() => getSurah(surah), [surah]);
  const activeSheet = showStudy
    ? "study"
    : showShare
      ? "share"
      : showPlaylistMenu
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
  const isPinnedForCompare = pinnedAyahs.some(
    (item) => Number(item.surah) === Number(surah) && Number(item.ayah) === Number(ayah),
  );

  useEffect(() => {
    let mounted = true;
    isBookmarked(surah, ayah).then((v) => { if (mounted) setBookmarked(v); });
    getNote(surah, ayah).then((note) => { if (mounted) setNoteText(note?.text || ""); });
    setMemoLevel(getMemorizationLevel(surah, ayah));
    return () => { mounted = false; };
  }, [ayah, surah]);

  useEffect(() => {
    const handleMemoSync = (event) => {
      if (event.detail?.surah === surah && event.detail?.ayah === ayah) {
        setMemoLevel(Number(event.detail.level) || 0);
      }
    };

    window.addEventListener("quran-memorization-updated", handleMemoSync);
    return () =>
      window.removeEventListener("quran-memorization-updated", handleMemoSync);
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
    setShowStudy(false);
    setShowNote(false);
    setShowShare(false);
    setShowPlaylistMenu(false);
  }, []);

  useEffect(() => {
    if (!activeSheet || typeof document === "undefined") return undefined;

    const sheet = sheetRef.current;
    if (!sheet) return undefined;

    sheetRestoreFocusRef.current = document.activeElement;
    const focusFrame = window.requestAnimationFrame(() => {
      const firstFocusable = sheet.querySelector(SHEET_FOCUSABLE_SELECTOR);
      (firstFocusable || sheet).focus();
    });

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
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleSheetKeyDown);
      const restoreTarget = sheetRestoreFocusRef.current;
      if (restoreTarget?.isConnected) restoreTarget.focus();
      sheetRestoreFocusRef.current = null;
    };
  }, [activeSheet, closePanels]);

  useEffect(() => {
    if (!showStudy || studyTab !== "tafsir") return undefined;

    const key = `${lang}:${surah}:${ayah}`;
    if (tafsirFetchedKeyRef.current === key) return undefined;
    tafsirFetchedKeyRef.current = key;

    const controller = new AbortController();
    let mounted = true;

    setTafsirState({ key, status: "loading", data: null, error: null });

    getVerseTafsir({ surah, ayah, lang, signal: controller.signal })
      .then((data) => {
        if (!mounted) return;
        setTafsirState({ key, status: "ready", data, error: null });
      })
      .catch((error) => {
        if (!mounted || error?.name === "AbortError") return;
        tafsirFetchedKeyRef.current = null;
        setTafsirState({ key, status: "error", data: null, error: error?.message || "Unable to load tafsir" });
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [ayah, lang, showStudy, studyTab, surah]);

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

  const updateMemorization = (nextLevel) => {
    setMemorizationLevel(surah, ayah, nextLevel);
    setMemoLevel(nextLevel);
    window.dispatchEvent(
      new CustomEvent("quran-memorization-updated", {
        detail: { surah, ayah, level: nextLevel },
      }),
    );
  };

  const handleMemorizationBoost = () => {
    const nextLevel = memoLevel >= 5 ? 0 : memoLevel + 1;
    updateMemorization(nextLevel);
    emitToast(
      nextLevel > 0 ? "success" : "info",
      nextLevel > 0
        ? t("toast.memorizationLevel", lang).replace("{level}", nextLevel)
        : t("toast.memorizationReset", lang),
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

  const repeatAyah = () => {
    const repeatCount = Math.max(2, Number(memRepeatCount) || 3);
    const pauseMs = Math.max(500, Number(memPause || 2) * 1000);
    set({ memMode: true, memRepeatCount: repeatCount, memPause: memPause || 2 });
    audioService.enableMemorization(repeatCount, pauseMs);
    playAyah();
    emitToast(
      "success",
      t("toast.repeatEnabled", lang).replace("{count}", repeatCount),
    );
  };

  const showTranslationForAyah = () => {
    set({ showTranslation: true, showWordByWord: false });
    emitToast(
      "info",
      t("toast.translationShown", lang),
    );
  };

  const copyVerseText = async (value, successMessage) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
      emitToast("success", successMessage);
    } catch (error) {
      console.warn("Copy failed:", error);
    }
  };

  const copyText = async () => {
    await copyVerseText(
      ayahData?.text,
      t("toast.textCopied", lang),
    );
  };

  const getShareText = () => {
    const surahName = surahInfo
      ? lang === "fr"
        ? surahInfo.fr
        : surahInfo.en
      : `Surah ${surah}`;
    return `${ayahData?.text || ""}\n\n- ${surahName} (${surah}:${ayah})\nMushafPlus`;
  };

  const shareTo = (url) => {
    openExternalUrl(url);
    closePanels();
  };

  const shareWhatsApp = () => {
    shareTo(`https://wa.me/?text=${encodeURIComponent(getShareText())}`);
  };

  const shareTelegram = () => {
    shareTo(
      `https://t.me/share/url?text=${encodeURIComponent(getShareText())}`,
    );
  };

  const shareTwitter = () => {
    shareTo(
      `https://x.com/intent/tweet?text=${encodeURIComponent(
        getShareText().slice(0, 280),
      )}`,
    );
  };

  const shareEmail = () => {
    const surahName = surahInfo
      ? lang === "fr"
        ? surahInfo.fr
        : surahInfo.en
      : `Surah ${surah}`;
    const subject = encodeURIComponent(`${surahName} (${surah}:${ayah})`);
    const body = encodeURIComponent(getShareText());
    shareTo(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareNative = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: "MushafPlus", text: getShareText() });
    } catch {
      // user cancelled
    }
    closePanels();
  };

  const shareCopyText = async () => {
    await copyVerseText(
      getShareText(),
      t("toast.shareTextCopied", lang),
    );
    closePanels();
  };

  const shareAsImage = async () => {
    if (!ayahData?.text) return;

    const width = 1080;
    const height = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#184a38");
    gradient.addColorStop(1, "#0b1d19");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "#d3b46a";
    context.lineWidth = 8;
    context.strokeRect(30, 30, width - 60, height - 60);
    context.lineWidth = 2;
    context.strokeRect(48, 48, width - 96, height - 96);

    await document.fonts.ready;

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.direction = "rtl";
    context.fillStyle = "#ffffff";

    const text = ayahData.text;
    const fontSize = Math.max(38, Math.min(54, Math.floor(width / (text.length / 4))));
    context.font = `${fontSize}px "Scheherazade New", "Amiri Quran", serif`;

    const maxWidth = width - 180;
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    const lineHeight = fontSize * 1.88;
    const totalTextHeight = lines.length * lineHeight;
    const startY = height / 2 - totalTextHeight / 2 + lineHeight / 2 - 64;
    lines.forEach((currentLine, index) =>
      context.fillText(currentLine, width / 2, startY + index * lineHeight),
    );

    const surahName = surahInfo
      ? lang === "fr"
        ? surahInfo.fr
        : surahInfo.en
      : `Surah ${surah}`;
    context.direction = "ltr";
    context.font = '30px "Cairo", "Noto Naskh Arabic", sans-serif';
    context.fillStyle = "#d3b46a";
    context.fillText(`- ${surahName} (${surah}:${ayah})`, width / 2, height - 180);

    context.font = '22px "Cairo", sans-serif';
    context.fillStyle = "rgba(255,255,255,0.3)";
    context.fillText("MushafPlus", width / 2, height - 108);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return;

    const file = new File([blob], `mushafplus_${surah}_${ayah}.png`, {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "MushafPlus",
          text: getShareText(),
        });
      } catch {
        // user cancelled
      }
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mushafplus_${surah}_${ayah}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    closePanels();
  };

  const openPlaylistMenu = async () => {
    if (!showPlaylistMenu) {
      const nextPlaylists = await getAllPlaylists();
      setPlaylists(nextPlaylists);
    }
    setShowStudy(false);
    setShowShare(false);
    setShowNote(false);
    setShowPlaylistMenu((value) => !value);
  };

  const toggleStudyPanel = (tab = "tafsir") => {
    setShowPlaylistMenu(false);
    setShowShare(false);
    setShowNote(false);
    setStudyTab(tab);
    setShowStudy((value) => (value && studyTab === tab ? false : true));
  };

  const retryTafsir = () => {
    tafsirFetchedKeyRef.current = null;
    setTafsirState({ key: null, status: "idle", data: null, error: null });
  };

  const handleStudyMode = () => {
    const wordByWordAvailable = riwaya !== "warsh";
    set({
      memMode: false,
      showTranslation: true,
      showWordByWord: wordByWordAvailable,
      ...(wordByWordAvailable ? { showWordTranslation: true } : {}),
      showTransliteration: false,
      focusReading: true,
    });
    emitToast(
      "info",
      t("toast.studyModeEnabled", lang),
    );
  };

  const toggleComparePin = () => {
    if (isPinnedForCompare) {
      set({
        pinnedAyahs: pinnedAyahs.filter(
          (item) =>
            !(Number(item.surah) === Number(surah) && Number(item.ayah) === Number(ayah)),
        ),
      });
      emitToast(
        "info",
        t("toast.pinRemoved", lang),
      );
      return;
    }

    if (pinnedAyahs.length >= 4) {
      emitToast(
        "info",
        t("toast.pinLimit", lang),
      );
      return;
    }

    set({
      pinnedAyahs: [
        ...pinnedAyahs,
        {
          surah,
          ayah,
          number: ayahData?.number || null,
          text: ayahData?.text || "",
          surahName:
            lang === "fr"
              ? surahInfo?.fr || surahInfo?.en || ""
              : surahInfo?.en || "",
        },
      ],
    });
    emitToast(
      "success",
      t("toast.pinAdded", lang),
    );
  };

  const quickActions = [
    {
      key: "play",
      className: `ayah-action-card ayah-action-card--play${isPlayingThisAyah ? " is-active" : ""}`,
      icon: audioError
        ? "fa-triangle-exclamation"
        : isPlayingThisAyah
          ? "fa-pause"
          : "fa-play",
      label: isPlayingThisAyah ? t("audio.pause", lang) : t("actions.listen", lang),
      active: isPlayingThisAyah,
      onClick: () => {
        if (isCurrentAyah) {
          audioService.toggle();
        } else {
          playAyah();
        }
      },
    },
    {
      key: "memorize",
      className: `ayah-action-card ayah-action-card--memorize${memoLevel > 0 ? " is-active" : ""}`,
      icon: "fa-star",
      label:
        lang === "fr"
          ? "Mémoriser"
          : lang === "ar"
            ? "حفظ"
            : "Memorize",
      state: memoLevel > 0 ? `${memoLevel}/5` : lang === "fr" ? "Démarrer" : lang === "ar" ? "ابدأ" : "Start",
      active: memoLevel > 0,
      onClick: handleMemorizationBoost,
    },
    {
      key: "repeat",
      className: "ayah-action-card ayah-action-card--repeat",
      icon: "fa-repeat",
      label:
        lang === "fr"
          ? "Répéter"
          : lang === "ar"
            ? "تكرار"
            : "Repeat",
      state: `x${Math.max(2, Number(memRepeatCount) || 3)}`,
      active: false,
      onClick: repeatAyah,
    },
    {
      key: "note",
      className: `ayah-action-card${showNote ? " is-active" : ""}`,
      icon: "pen-line",
      label: lang === "fr" ? "Noter" : lang === "ar" ? "ملاحظة" : "Note",
      state: noteText.trim()
        ? lang === "fr"
          ? "Note prete"
          : lang === "ar"
            ? "ملاحظة محفوظة"
            : "Saved note"
        : null,
      active: showNote || Boolean(noteText.trim()),
      onClick: () => {
        setShowStudy(false);
        setShowPlaylistMenu(false);
        setShowShare(false);
        setShowNote((value) => !value);
      },
    },
    {
      key: "share",
      className: `ayah-action-card${showShare ? " is-active" : ""}`,
      icon: "fa-share-nodes",
      label: lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Share",
      state: null,
      active: showShare,
      onClick: () => {
        setShowStudy(false);
        setShowPlaylistMenu(false);
        setShowNote(false);
        setShowShare((value) => !value);
      },
    },
    {
      key: "study",
      className: `ayah-action-card ayah-action-card--study${showStudy ? " is-active" : ""}`,
      icon: "fa-book-open",
      label: lang === "fr" ? "Étude" : lang === "ar" ? "دراسة" : "Study",
      state: null,
      active: showStudy,
      onClick: () => toggleStudyPanel("tafsir"),
    },
  ];

  const inlineIconButtonClass =
    "ayah-actions-inline__icon-btn inline-flex h-[2.06rem] w-[2.06rem] cursor-pointer items-center justify-center rounded-full border border-[rgba(var(--primary-rgb),0.22)] bg-[rgba(var(--primary-rgb),0.06)] text-[var(--text-secondary)] transition-[background,color,border-color] duration-150 ease-out hover:border-[rgba(var(--primary-rgb),0.4)] hover:bg-[rgba(var(--primary-rgb),0.16)] hover:text-[var(--text-primary)] max-[640px]:h-[2.14rem] max-[640px]:w-[2.14rem]";
  const inlineIconButtonActiveClass =
    "is-active border-[rgba(var(--primary-rgb),0.4)] bg-[rgba(var(--primary-rgb),0.16)] text-[var(--text-primary)]";

  const studyTabs = useMemo(
    () => [
      {
        key: "tafsir",
        icon: "fa-book-open",
        label: lang === "fr" ? "Tafsir" : lang === "ar" ? "تفسير" : "Tafsir",
      },
      {
        key: "lessons",
        icon: "fa-lightbulb",
        label: lang === "fr" ? "Leçons" : lang === "ar" ? "فوائد" : "Lessons",
      },
      {
        key: "reflections",
        icon: "fa-feather",
        label:
          lang === "fr"
            ? "Réflexions"
            : lang === "ar"
              ? "تدبر"
              : "Reflections",
      },
      {
        key: "notes",
        icon: "pen-line",
        label: lang === "fr" ? "Notes" : lang === "ar" ? "ملاحظات" : "Notes",
      },
    ],
    [lang],
  );

  const studyLessons = useMemo(
    () => [
      {
        icon: "fa-language",
        title:
          lang === "fr"
            ? "Lire avec le mot a mot"
            : lang === "ar"
              ? "اقرأ كلمة بكلمة"
              : "Read word by word",
        text:
          lang === "fr"
            ? "Active l'analyse pour suivre le sens de chaque mot sans quitter le verset."
            : lang === "ar"
              ? "فعل التحليل لمتابعة معنى كل كلمة داخل الآية."
              : "Turn on analysis to follow each word while staying in the verse.",
      },
      {
        icon: "fa-headphones",
        title:
          lang === "fr"
            ? "Écouter puis relire"
            : lang === "ar"
              ? "استمع ثم أعد القراءة"
              : "Listen then reread",
        text:
          lang === "fr"
            ? "Lance l'audio du verset, puis reviens au texte arabe pour fixer le rythme."
            : lang === "ar"
              ? "شغل صوت الآية ثم عد إلى النص لتثبيت الإيقاع."
              : "Play the verse, then return to the Arabic text to anchor the rhythm.",
      },
      {
        icon: "fa-quote-right",
        title:
          lang === "fr"
            ? "Comparer avec la traduction"
            : lang === "ar"
              ? "قارن مع الترجمة"
              : "Compare translation",
        text:
          lang === "fr"
            ? "Garde la traduction ouverte pour vérifier le sens avant de prendre une note."
            : lang === "ar"
              ? "اترك الترجمة مفتوحة لفهم المعنى قبل تدوين ملاحظة."
              : "Keep translation open to check the meaning before writing a note.",
      },
    ],
    [lang],
  );

  const reflectionPrompts = useMemo(
    () => [
      lang === "fr"
        ? "Quel sens revient directement dans ma vie aujourd'hui ?"
        : lang === "ar"
          ? "ما المعنى الذي يلامس حياتي اليوم؟"
          : "What meaning touches my life today?",
      lang === "fr"
        ? "Quel nom, ordre ou rappel d'Allah apparait ici ?"
        : lang === "ar"
          ? "أي اسم أو أمر أو تذكير يظهر هنا؟"
          : "Which name, command, or reminder appears here?",
      lang === "fr"
        ? "Quelle action simple puis-je garder apres cette lecture ?"
        : lang === "ar"
          ? "ما العمل البسيط الذي أحفظه بعد القراءة؟"
          : "What simple action can I keep after this reading?",
    ],
    [lang],
  );

  const renderStudyContent = () => {
    if (studyTab === "tafsir") {
      if (tafsirState.status === "loading") {
        return (
          <div className="ayah-study-loading" aria-live="polite">
            <span />
            <span />
            <span />
          </div>
        );
      }

      if (tafsirState.status === "error") {
        return (
          <div className="ayah-study-empty">
            <AlertTriangle size={16} />
            <p>
              {lang === "fr"
                ? "Tafsir indisponible pour le moment."
                : lang === "ar"
                  ? "التفسير غير متاح حاليا."
                  : "Tafsir is unavailable for now."}
            </p>
            <button type="button" onClick={retryTafsir}>
              {lang === "fr" ? "Réessayer" : lang === "ar" ? "أعد المحاولة" : "Retry"}
            </button>
          </div>
        );
      }

      return (
        <div className="ayah-study-tafsir">
          <div className="ayah-study-source">
            <BookOpen size={13} />
            <span>{tafsirState.data?.source || "Tafsir Ibn Kathir"}</span>
          </div>
          <p>
            {tafsirState.data?.text ||
              (lang === "fr"
                ? "Ouvre cet onglet pour charger le tafsir du verset."
                : lang === "ar"
                  ? "افتح هذا التبويب لتحميل تفسير الآية."
                  : "Open this tab to load the verse tafsir.")}
          </p>
          {tafsirState.data?.note ? (
            <div className="mt-3 rounded-lg border border-[rgba(var(--primary-rgb),0.18)] bg-[rgba(var(--primary-rgb),0.06)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              {tafsirState.data.note}
            </div>
          ) : null}
        </div>
      );
    }

    if (studyTab === "lessons") {
      return (
        <div className="ayah-study-lessons">
          {(riwaya === "warsh" ? studyLessons.slice(1) : studyLessons).map((lesson) => (
            <div className="ayah-study-card" key={lesson.title}>
              {faIcon(lesson.icon)}
              <div>
                <strong>{lesson.title}</strong>
                <p>{lesson.text}</p>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="ayah-study-primary"
            onClick={handleStudyMode}
          >
            <Languages size={16} />
            {lang === "fr"
              ? "Activer le mode étude"
              : lang === "ar"
                ? "تفعيل وضع الدراسة"
                : "Enable study mode"}
          </button>
        </div>
      );
    }

    if (studyTab === "reflections") {
      return (
        <div className="ayah-study-reflections">
          {reflectionPrompts.map((prompt) => (
            <button
              type="button"
              className="ayah-study-prompt"
              key={prompt}
              onClick={() => {
                setNoteText((value) =>
                  value.trim() ? value : `${prompt}\n`,
                );
                setStudyTab("notes");
              }}
            >
              <Feather size={16} />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="ayah-study-notes">
        <label
          className="sr-only"
          htmlFor={`${sheetIdBase}-study-note`}
        >
          {noteFieldLabel}
        </label>
        <textarea
          id={`${sheetIdBase}-study-note`}
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
    );
  };

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
          {/* Copy */}
          <button
            type="button"
            className={cn(
              "ayah-action ayah-action--copy h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
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
            className={cn(
              "ayah-action ayah-action--share h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
              showShare
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={() => {
              setShowStudy(false);
              setShowPlaylistMenu(false);
              setShowNote(false);
              setShowShare((value) => !value);
            }}
            aria-label={lang === "fr" ? "Partager ce verset" : lang === "ar" ? "مشاركة الآية" : "Share verse"}
            title={lang === "fr" ? "Partager" : "Share"}
          >
            <Share2 size={13} />
          </button>

          {/* Note */}
          <button
            type="button"
            className={cn(
              "ayah-action ayah-action--note h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
              (showNote || noteText.trim())
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[rgba(var(--primary-rgb),0.1)] hover:text-[var(--primary)]"
            )}
            onClick={() => {
              setShowStudy(false);
              setShowPlaylistMenu(false);
              setShowShare(false);
              setShowNote((value) => !value);
            }}
            aria-label={lang === "fr" ? "Ajouter une note" : lang === "ar" ? "إضافة ملاحظة" : "Add note"}
            title={lang === "fr" ? "Note" : "Note"}
          >
            <PenSquare size={13} />
          </button>

          {/* Playlist / Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
          <button
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
                onClick={() => {
                  setShowStudy(false);
                  setShowPlaylistMenu(false);
                  setShowNote(false);
                  setShowShare(true);
                }}
              >
                <Share2 size={13} className="text-[var(--primary)]" />
                <span>{lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Share"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setShowStudy(false);
                  setShowPlaylistMenu(false);
                  setShowShare(false);
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
              <DropdownMenuItem onClick={repeatAyah}>
                <Repeat size={13} className="text-[var(--primary)]" />
                <span>{lang === "fr" ? "Répéter le verset" : lang === "ar" ? "تكرار الآية" : "Repeat verse"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleComparePin}>
                <Pin size={13} className="text-[var(--primary)]" />
                <span>
                  {isPinnedForCompare
                    ? (lang === "fr" ? "Retirer de la comparaison" : lang === "ar" ? "إزالة من المقارنة" : "Remove compare")
                    : (lang === "fr" ? "Épingler pour comparer" : lang === "ar" ? "Épingler pour comparer" : "Compare verse")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleStudyPanel("tafsir")}>
                <BookOpen size={13} className="text-[var(--primary)]" />
                <span>Tafsir &amp; {lang === "fr" ? "Étude" : lang === "ar" ? "دراسة" : "Study"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : layout === "qcom-list-study" ? (
        <div className="qcom-list-study-links select-none">
          <button
            type="button"
            className={cn("qcom-list-study-link", showStudy && studyTab === "tafsir" && "is-active")}
            onClick={() => toggleStudyPanel("tafsir")}
          >
            <BookOpen size={13} />
            <span>{lang === "fr" ? "Tafsirs" : lang === "ar" ? "تفسير" : "Tafsirs"}</span>
          </button>
          <span className="qcom-list-study-separator" aria-hidden="true" />
          <button
            type="button"
            className={cn("qcom-list-study-link", showStudy && studyTab === "lessons" && "is-active")}
            onClick={() => toggleStudyPanel("lessons")}
          >
            <Layers size={13} />
            <span>{lang === "fr" ? "Leçons" : lang === "ar" ? "فوائد" : "Lessons"}</span>
          </button>
          <span className="qcom-list-study-separator" aria-hidden="true" />
          <button
            type="button"
            className={cn("qcom-list-study-link", showStudy && studyTab === "reflections" && "is-active")}
            onClick={() => toggleStudyPanel("reflections")}
          >
            <MessageCircle size={13} />
            <span>{lang === "fr" ? "Réflexions" : lang === "ar" ? "تدبر" : "Reflections"}</span>
          </button>
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
            className={cn(
              "qcom-verse-card-footer-btn flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)] text-muted-foreground transition-all cursor-pointer",
              showShare && "text-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] font-semibold"
            )}
            onClick={() => {
              setShowStudy(false);
              setShowPlaylistMenu(false);
              setShowNote(false);
              setShowShare((value) => !value);
            }}
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
              setShowStudy(false);
              setShowPlaylistMenu(false);
              setShowShare(false);
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

          {/* Compare */}
          <button
            type="button"
            className={cn(
              "qcom-verse-card-footer-btn flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[rgba(var(--primary-rgb),0.08)] hover:text-[var(--primary)] text-muted-foreground transition-all cursor-pointer",
              isPinnedForCompare && "text-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] font-semibold"
            )}
            onClick={toggleComparePin}
          >
            <Pin size={12} />
            <span>{isPinnedForCompare ? (lang === "fr" ? "Épinglé" : "Pinned") : (lang === "fr" ? "Comparer" : "Compare")}</span>
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
            onClick={() => {
              setShowStudy(false);
              setShowPlaylistMenu(false);
              setShowNote(false);
              setShowShare(true);
            }}
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
            onClick={() => {
              setShowStudy(false);
              setShowPlaylistMenu(false);
              setShowNote(false);
              setShowShare(true);
            }}
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
              className={inlineIconButtonClass}
              onClick={repeatAyah}
              title={lang === "fr" ? "Répéter le verset" : lang === "ar" ? "تكرار الآية" : "Repeat verse"}
              aria-label={lang === "fr" ? "Répéter le verset" : lang === "ar" ? "تكرار الآية" : "Repeat verse"}
            >
              <Repeat size={13} />
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
            <button
              type="button"
              className={cn(
                inlineIconButtonClass,
                isPinnedForCompare && inlineIconButtonActiveClass,
              )}
              onClick={toggleComparePin}
              title={
                isPinnedForCompare
                  ? lang === "fr"
                    ? "Retirer de la comparaison"
                    : "Remove from compare"
                  : lang === "fr"
                    ? "Epingler pour comparer"
                    : "Pin to compare"
              }
              aria-label={lang === "fr" ? "Comparer le verset" : "Compare verse"}
            >
              <Pin size={13} />
            </button>
            <button
              type="button"
              className={cn(
                inlineIconButtonClass,
                copied && inlineIconButtonActiveClass,
              )}
              onClick={copyText}
              title={lang === "fr" ? "Copier" : lang === "ar" ? "نسخ" : "Copy"}
              aria-label={lang === "fr" ? "Copier le verset" : lang === "ar" ? "نسخ الآية" : "Copy verse"}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <button
              type="button"
              className={cn(
                inlineIconButtonClass,
                showShare && inlineIconButtonActiveClass,
              )}
              onClick={() => {
                setShowStudy(false);
                setShowPlaylistMenu(false);
                setShowNote(false);
                setShowShare((value) => !value);
              }}
              title={lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Share"}
              aria-label={lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Share"}
            >
              <Share2 size={13} />
            </button>
            <button
              type="button"
              className={cn(
                inlineIconButtonClass,
                showStudy && inlineIconButtonActiveClass,
              )}
              onClick={() => toggleStudyPanel("tafsir")}
              title={lang === "fr" ? "Étude" : lang === "ar" ? "دراسة" : "Study"}
              aria-label={lang === "fr" ? "Ouvrir l'étude" : lang === "ar" ? "فتح الدراسة" : "Open study"}
            >
              <BookOpen size={13} />
            </button>
            <button
              type="button"
              className={cn(
                inlineIconButtonClass,
                showNote && inlineIconButtonActiveClass,
              )}
              onClick={() => {
                setShowStudy(false);
                setShowPlaylistMenu(false);
                setShowShare(false);
                setShowNote((value) => !value);
              }}
              title={lang === "fr" ? "Noter" : lang === "ar" ? "ملاحظة" : "Note"}
              aria-label={lang === "fr" ? "Ajouter une note" : lang === "ar" ? "إضافة ملاحظة" : "Add note"}
            >
              <PenSquare size={13} />
            </button>
            <button
              type="button"
              className={cn(
                inlineIconButtonClass,
                showPlaylistMenu && inlineIconButtonActiveClass,
              )}
              onClick={openPlaylistMenu}
              title={lang === "fr" ? "Playlist" : lang === "ar" ? "قائمة" : "Playlist"}
              aria-label={lang === "fr" ? "Ajouter a la playlist" : lang === "ar" ? "إضافة إلى القائمة" : "Add to playlist"}
            >
              <List size={13} />
            </button>
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
              <span className={cn("ayah-actions__badge", memoLevel > 0 && "is-on")}>
                <Star size={12} aria-hidden="true" />
                {lang === "fr" ? "Mémo" : lang === "ar" ? "الحفظ" : "Memory"} {memoLevel}/5
              </span>
            </div>
          </div>

          <div className="ayah-actions__grid">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                className={action.className}
                onClick={action.onClick}
                aria-pressed={action.active || undefined}
              >
                <span className="ayah-action-card__icon">
                  {faIcon(action.icon)}
                </span>
                <span className="ayah-action-card__content">
                  <span className="ayah-action-card__label">{action.label}</span>
                </span>
                {action.state ? (
                  <span className="ayah-action-card__state">{action.state}</span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="ayah-actions__utility">
            <button
              type="button"
              className={cn("ayah-actions__utility-btn", bookmarked && "is-active")}
              onClick={toggleBookmark}
              title={t("bookmarks.add", lang)}
            >
              <Bookmark size={13} />
              {bookmarked
                ? lang === "fr"
                  ? "Retirer le favori"
                  : lang === "ar"
                    ? "إزالة المفضلة"
                    : "Remove bookmark"
                  : lang === "fr"
                    ? "Ajouter aux favoris"
                    : lang === "ar"
                      ? "أضف إلى المفضلة"
                      : "Add bookmark"}
            </button>

            <button
              type="button"
              className={cn("ayah-actions__utility-btn", copied && "is-active")}
              onClick={copyText}
              title={t("actions.copy", lang)}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied
                ? lang === "fr"
                  ? "Copié"
                  : lang === "ar"
                    ? "تم النسخ"
                    : "Copied"
                : lang === "fr"
                  ? "Copier le texte"
                  : lang === "ar"
                    ? "نسخ النص"
                    : "Copy text"}
            </button>
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

      {showStudy && renderPortal(
        <div
          ref={sheetRef}
          className="ayah-action-sheet ayah-action-sheet--study"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${sheetIdBase}-study-title`}
          tabIndex={-1}
        >
          <div className="ayah-action-sheet__header">
            <div>
              <div className="ayah-action-sheet__eyebrow">
                {lang === "fr"
                  ? "Étude du verset"
                  : lang === "ar"
                    ? "دراسة الآية"
                    : "Verse study"}
              </div>
              <h2
                id={`${sheetIdBase}-study-title`}
                className="ayah-action-sheet__title"
              >
                {lang === "fr"
                  ? "Comprendre cette ayah"
                  : lang === "ar"
                    ? "فهم هذه الآية"
                    : "Understand this ayah"}
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

          <div
            className="ayah-study-tabs"
            role="tablist"
            aria-label={
              lang === "fr"
                ? "Rubriques d’étude"
                : lang === "ar"
                  ? "أقسام الدراسة"
                  : "Study sections"
            }
          >
            {studyTabs.map((tab) => (
              <button
                key={tab.key}
                id={`${sheetIdBase}-study-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={studyTab === tab.key}
                aria-controls={`${sheetIdBase}-study-panel`}
                className={`ayah-study-tab${studyTab === tab.key ? " is-active" : ""}`}
                onClick={() => setStudyTab(tab.key)}
              >
                {faIcon(tab.icon)}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div
            id={`${sheetIdBase}-study-panel`}
            className="ayah-study-content"
            role="tabpanel"
            aria-labelledby={`${sheetIdBase}-study-tab-${studyTab}`}
            tabIndex={0}
          >
            {renderStudyContent()}
          </div>
        </div>
      )}

      {showShare && renderPortal(
        <div
          ref={sheetRef}
          className="ayah-action-sheet ayah-action-sheet--share"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${sheetIdBase}-share-title`}
          tabIndex={-1}
        >
          <div className="ayah-action-sheet__header">
            <div>
              <div className="ayah-action-sheet__eyebrow">
                {lang === "fr"
                  ? "Partage premium"
                  : lang === "ar"
                    ? "مشاركة مميزة"
                    : "Premium sharing"}
              </div>
              <h2
                id={`${sheetIdBase}-share-title`}
                className="ayah-action-sheet__title"
              >
                {lang === "fr"
                  ? "Exporter cette ayah"
                  : lang === "ar"
                    ? "شارك هذه الآية"
                    : "Export this ayah"}
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

          <p className="ayah-action-sheet__copy">
            {lang === "fr"
              ? "Choisissez une sortie rapide : texte, réseau social, image classique ou carte calligraphique."
              : lang === "ar"
                ? "اختر مخرجاً سريعاً: نص، شبكة اجتماعية، صورة كلاسيكية أو بطاقة خطية."
                : "Choose a quick output: text, social app, classic image, or calligraphic card."}
          </p>

          <div className="ayah-actions__sheet-grid">
            <button type="button" className="share-btn share-btn--whatsapp" onClick={shareWhatsApp}>
              <Icon name="whatsapp" size={16} />
              <span className="share-btn__label">WhatsApp</span>
            </button>
            <button type="button" className="share-btn share-btn--telegram" onClick={shareTelegram}>
              <Icon name="telegram-plane" size={16} />
              <span className="share-btn__label">Telegram</span>
            </button>
            <button type="button" className="share-btn share-btn--x" onClick={shareTwitter}>
              <Icon name="x-twitter" size={16} />
              <span className="share-btn__label">X / Twitter</span>
            </button>
            <button type="button" className="share-btn share-btn--email" onClick={shareEmail}>
              <Mail size={16} />
              <span className="share-btn__label">Email</span>
            </button>
            <button type="button" className="share-btn share-btn--copy" onClick={shareCopyText}>
              <Copy size={16} />
              <span className="share-btn__label">
                {lang === "fr" ? "Texte de partage" : lang === "ar" ? "نسخ النص" : "Copy share text"}
              </span>
            </button>
            <button type="button" className="share-btn share-btn--image" onClick={shareAsImage}>
              <Image size={16} />
              <span className="share-btn__label">
                {lang === "fr" ? "Image sobre" : lang === "ar" ? "صورة" : "Simple image"}
              </span>
            </button>
            <button
              type="button"
              className="share-btn share-btn--card"
              onClick={() => {
                dispatch({ type: "SET", payload: { shareImageOpen: true } });
                closePanels();
              }}
            >
              <Wand2 size={16} />
              <span className="share-btn__label">
                {lang === "fr"
                  ? "Carte calligraphique"
                  : lang === "ar"
                    ? "بطاقة خطية"
                    : "Calligraphic card"}
              </span>
            </button>
            {navigator.share && (
              <button type="button" className="share-btn share-btn--native" onClick={shareNative}>
                <Share2 size={13} />
                <span className="share-btn__label">
                  {lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Native share"}
                </span>
              </button>
            )}
          </div>
        </div>
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
