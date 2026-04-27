import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
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

function emitToast(type, message) {
  window.dispatchEvent(
    new CustomEvent("quran-toast", {
      detail: { type, message },
    }),
  );
}

export default function AyahActions({ surah, ayah, ayahData, compact = false }) {
  const { state, dispatch, set } = useApp();
  const { lang, reciter, riwaya, warshStrictMode, displayMode } = state;

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
  const [playlists, setPlaylists] = useState([]);
  const [playlistAdded, setPlaylistAdded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);
  const [audioError, setAudioError] = useState(false);

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

  useEffect(() => {
    isBookmarked(surah, ayah).then(setBookmarked);
    getNote(surah, ayah).then((note) => setNoteText(note?.text || ""));
    setMemoLevel(getMemorizationLevel(surah, ayah));
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

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowStudy(false);
        setShowNote(false);
        setShowShare(false);
        setShowPlaylistMenu(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const closePanels = useCallback(() => {
    setShowStudy(false);
    setShowNote(false);
    setShowShare(false);
    setShowPlaylistMenu(false);
  }, []);

  useEffect(() => {
    if (!showStudy || studyTab !== "tafsir") return undefined;

    const key = `${surah}:${ayah}`;
    if (
      tafsirState.key === key &&
      ["loading", "ready", "error"].includes(tafsirState.status)
    ) {
      return undefined;
    }

    const controller = new AbortController();
    let mounted = true;

    setTafsirState({
      key,
      status: "loading",
      data: null,
      error: null,
    });

    getVerseTafsir({ surah, ayah, signal: controller.signal })
      .then((data) => {
        if (!mounted) return;
        setTafsirState({
          key,
          status: "ready",
          data,
          error: null,
        });
      })
      .catch((error) => {
        if (!mounted || error?.name === "AbortError") return;
        setTafsirState({
          key,
          status: "error",
          data: null,
          error: error?.message || "Unable to load tafsir",
        });
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [ayah, showStudy, studyTab, surah, tafsirState.key, tafsirState.status]);

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
        toastText("Favori retire", "تمت إزالة الحفظ", "Bookmark removed"),
      );
      return;
    }

    await addBookmark(surah, ayah);
    setBookmarked(true);
    emitToast(
      "success",
      toastText("Verset ajoute aux favoris", "تمت إضافة الآية للمفضلة", "Verse bookmarked"),
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
        ? toastText(
            `Niveau de mémorisation ${nextLevel}/5`,
            `مستوى الحفظ ${nextLevel}/5`,
            `Memorization level ${nextLevel}/5`,
          )
        : toastText(
            "Progression de mémorisation remise à zéro",
            "تمت إعادة مستوى الحفظ",
            "Memorization progress reset",
          ),
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
      toastText("Note enregistree", "تم حفظ الملاحظة", "Note saved"),
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
      window.setTimeout(() => setAudioError(false), 2500);
      emitToast(
        "error",
        toastText(
          "Recitateur incompatible avec le mode Warsh strict",
          "القارئ غير متوافق مع وضع ورش الصارم",
          "Reciter is incompatible with strict Warsh mode",
        ),
      );
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
        toastText(
          "Ce recitateur Warsh diffuse la sourate complete.",
          "هذا القارئ في ورش يقرأ السورة كاملة.",
          "This Warsh reciter plays the full surah.",
        ),
      );
    }

    audioService.playSingle(url, { surah, ayah: isSurahOnlyReciter(rec) ? null : ayah }).catch(() => {
      setAudioError(true);
      window.setTimeout(() => setAudioError(false), 2500);
      emitToast(
        "error",
        toastText(
          "Lecture impossible pour cette ayah",
          "تعذر تشغيل هذه الآية",
          "Unable to play this ayah",
        ),
      );
    });
  };

  const copyVerseText = async (value, successMessage) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
      emitToast("success", successMessage);
    } catch (error) {
      console.warn("Copy failed:", error);
    }
  };

  const copyText = async () => {
    await copyVerseText(
      ayahData?.text,
      toastText("Texte copie", "تم نسخ النص", "Text copied"),
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
      toastText("Texte de partage copie", "تم نسخ نص المشاركة", "Share text copied"),
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
    setTafsirState({
      key: null,
      status: "idle",
      data: null,
      error: null,
    });
  };

  const handleStudyMode = () => {
    set({
      memMode: false,
      showTranslation: true,
      showWordByWord: true,
      showWordTranslation: true,
      showTransliteration: false,
      focusReading: true,
    });
    emitToast(
      "info",
      toastText("Mode etude active", "تم تفعيل وضع الدراسة", "Study mode enabled"),
    );
  };

  const quickActions = [
    {
      key: "play",
      className: "ayah-action-card ayah-action-card--play",
      icon: audioError ? "fa-triangle-exclamation" : "fa-play",
      label: lang === "fr" ? "Ecouter" : lang === "ar" ? "استماع" : "Listen",
      description:
        lang === "fr"
          ? "Lancer cette ayah"
          : lang === "ar"
            ? "تشغيل هذه الآية"
            : "Play this ayah",
      state: audioError
        ? lang === "fr"
          ? "Erreur audio"
          : lang === "ar"
            ? "خطأ صوتي"
            : "Audio error"
        : null,
      active: Boolean(audioError),
      onClick: playAyah,
    },
    {
      key: "memorize",
      className: `ayah-action-card ayah-action-card--memorize${memoLevel > 0 ? " is-active" : ""}`,
      icon: "fa-star",
      label:
        lang === "fr"
          ? "Memoriser"
          : lang === "ar"
            ? "حفظ"
            : "Memorize",
      description:
        lang === "fr"
          ? "Augmenter la progression"
          : lang === "ar"
            ? "ارفع مستوى الحفظ"
            : "Boost progress",
      state: memoLevel > 0 ? `${memoLevel}/5` : lang === "fr" ? "Demarrer" : lang === "ar" ? "ابدأ" : "Start",
      active: memoLevel > 0,
      onClick: handleMemorizationBoost,
    },
    {
      key: "note",
      className: `ayah-action-card${showNote ? " is-active" : ""}`,
      icon: "fa-pen-line",
      label: lang === "fr" ? "Noter" : lang === "ar" ? "ملاحظة" : "Note",
      description:
        lang === "fr"
          ? "Ecrire une reflexion"
          : lang === "ar"
            ? "اكتب ملاحظة"
            : "Write a reflection",
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
      description:
        lang === "fr"
          ? "Texte, image ou lien"
          : lang === "ar"
            ? "نص أو صورة أو رابط"
            : "Text, image, or link",
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
      key: "playlist",
      className: `ayah-action-card${playlistAdded || showPlaylistMenu ? " is-complete" : ""}`,
      icon: playlistAdded ? "fa-check" : "fa-list",
      label:
        lang === "fr"
          ? "Playlist"
          : lang === "ar"
            ? "قائمة"
            : "Playlist",
      description:
        lang === "fr"
          ? "Ajouter a une serie"
          : lang === "ar"
            ? "أضف إلى قائمة"
            : "Add to a list",
      state: playlistAdded
        ? lang === "fr"
          ? "Ajoute"
          : lang === "ar"
            ? "تمت الإضافة"
            : "Added"
        : null,
      active: playlistAdded || showPlaylistMenu,
      onClick: openPlaylistMenu,
    },
    {
      key: "study",
      className: `ayah-action-card ayah-action-card--study${showStudy ? " is-active" : ""}`,
      icon: "fa-book-open",
      label: lang === "fr" ? "Etude" : lang === "ar" ? "دراسة" : "Study",
      description:
        lang === "fr"
          ? "Tafsir, lecons, notes"
          : lang === "ar"
            ? "ترجمة وكلمة بكلمة"
            : "Tafsir, lessons, notes",
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
        label: lang === "fr" ? "Lecons" : lang === "ar" ? "فوائد" : "Lessons",
      },
      {
        key: "reflections",
        icon: "fa-feather",
        label:
          lang === "fr"
            ? "Reflexions"
            : lang === "ar"
              ? "تدبر"
              : "Reflections",
      },
      {
        key: "notes",
        icon: "fa-pen-line",
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
            ? "Ecouter puis relire"
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
            ? "Garde la traduction ouverte pour verifier le sens avant de prendre une note."
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
            <i className="fas fa-circle-exclamation" />
            <p>
              {lang === "fr"
                ? "Tafsir indisponible pour le moment."
                : lang === "ar"
                  ? "التفسير غير متاح حاليا."
                  : "Tafsir is unavailable for now."}
            </p>
            <button type="button" onClick={retryTafsir}>
              {lang === "fr" ? "Reessayer" : lang === "ar" ? "أعد المحاولة" : "Retry"}
            </button>
          </div>
        );
      }

      return (
        <div className="ayah-study-tafsir">
          <div className="ayah-study-source">
            <i className="fas fa-book-open" />
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
        </div>
      );
    }

    if (studyTab === "lessons") {
      return (
        <div className="ayah-study-lessons">
          {studyLessons.map((lesson) => (
            <div className="ayah-study-card" key={lesson.title}>
              <i className={`fas ${lesson.icon}`} />
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
            <i className="fas fa-language" />
            {lang === "fr"
              ? "Activer le mode etude"
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
              <i className="fas fa-feather" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="ayah-study-notes">
        <textarea
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

  return (
    <div className="ayah-actions" onClick={(event) => event.stopPropagation()}>
      {compact ? (
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
              className={inlineIconButtonClass}
              onClick={playAyah}
              title={lang === "fr" ? "Ecouter" : lang === "ar" ? "استماع" : "Listen"}
              aria-label={lang === "fr" ? "Ecouter le verset" : lang === "ar" ? "تشغيل الآية" : "Play verse"}
            >
              <i className={`fas fa-${audioError ? "triangle-exclamation" : "play"}`} />
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
              <i className="fas fa-bookmark" />
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
              <i className={`fas ${copied ? "fa-check" : "fa-copy"}`} />
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
              <i className="fas fa-share-nodes" />
            </button>
            <button
              type="button"
              className={cn(
                inlineIconButtonClass,
                showStudy && inlineIconButtonActiveClass,
              )}
              onClick={() => toggleStudyPanel("tafsir")}
              title={lang === "fr" ? "Etude" : lang === "ar" ? "دراسة" : "Study"}
              aria-label={lang === "fr" ? "Ouvrir l'etude" : lang === "ar" ? "فتح الدراسة" : "Open study"}
            >
              <i className="fas fa-book-open" />
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
              <i className="fas fa-pen-to-square" />
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
              <i className="fas fa-ellipsis" />
            </button>
          </div>

        </div>
      ) : (
        <div className="ayah-actions__surface ayah-actions__surface--compact">
          <div className="ayah-actions__meta">
            <div>
              <span className="ayah-actions__kicker">
                <i className="fas fa-bolt" />
                {lang === "fr"
                  ? "Actions rapides"
                  : lang === "ar"
                    ? "إجراءات سريعة"
                    : "Quick actions"}
              </span>
              <div className="ayah-actions__verse">
                <span>
                  {lang === "fr"
                    ? surahInfo?.fr || surahInfo?.en
                    : lang === "ar"
                      ? surahInfo?.ar
                      : surahInfo?.en}
                </span>
                <span className="ayah-actions__verse-ar" dir="rtl">
                  {surahInfo?.ar}
                </span>
                <span>({surah}:{ayah})</span>
              </div>
            </div>

            <div className="ayah-actions__badges">
              <span className={`ayah-actions__badge${bookmarked ? " is-on" : ""}`}>
                <i className="fas fa-bookmark" />
                {bookmarked
                  ? lang === "fr"
                    ? "favori"
                    : lang === "ar"
                      ? "مفضلة"
                      : "saved"
                  : lang === "fr"
                    ? "non epingle"
                    : lang === "ar"
                      ? "غير محفوظة"
                      : "not saved"}
              </span>
              <span className={`ayah-actions__badge${memoLevel > 0 ? " is-on" : ""}`}>
                <i className="fas fa-star" />
                {memoLevel > 0 ? `${memoLevel}/5` : "0/5"}
              </span>
            </div>
          </div>

          <div className="ayah-actions__grid">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                className={`${action.className}${action.active ? " is-active" : ""}`}
                onClick={action.onClick}
              >
                <span className="ayah-action-card__icon">
                  <i className={`fas ${action.icon}`} />
                </span>
                <span className="ayah-action-card__label">{action.label}</span>
                <span className="ayah-action-card__desc">{action.description}</span>
                {action.state && (
                  <span className="ayah-action-card__state">{action.state}</span>
                )}
              </button>
            ))}
          </div>

          <div className="ayah-actions__utility">
            <button
              type="button"
              className={`ayah-actions__utility-btn${bookmarked ? " is-active" : ""}`}
              onClick={toggleBookmark}
              title={t("bookmarks.add", lang)}
            >
              <i className="fas fa-bookmark" />
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
              className={`ayah-actions__utility-btn${copied ? " is-active" : ""}`}
              onClick={copyText}
              title={t("actions.copy", lang)}
            >
              <i className={`fas ${copied ? "fa-check" : "fa-copy"}`} />
              {copied
                ? lang === "fr"
                  ? "Copie"
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

      {activeSheet && (
        <button
          type="button"
          className="ayah-action-sheet-backdrop"
          aria-label={lang === "fr" ? "Fermer le panneau" : "Close panel"}
          onClick={closePanels}
        />
      )}

      {showStudy && (
        <div className="ayah-action-sheet ayah-action-sheet--study">
          <div className="ayah-action-sheet__header">
            <div>
              <div className="ayah-action-sheet__eyebrow">
                {lang === "fr"
                  ? "Etude du verset"
                  : lang === "ar"
                    ? "دراسة الآية"
                    : "Verse study"}
              </div>
              <div className="ayah-action-sheet__title">
                {lang === "fr"
                  ? "Comprendre cette ayah"
                  : lang === "ar"
                    ? "فهم هذه الآية"
                    : "Understand this ayah"}
              </div>
            </div>
            <button
              type="button"
              className="ayah-action-sheet__close"
              onClick={closePanels}
            >
              <i className="fas fa-times" />
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

          <div className="ayah-study-tabs" role="tablist">
            {studyTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={studyTab === tab.key}
                className={`ayah-study-tab${studyTab === tab.key ? " is-active" : ""}`}
                onClick={() => setStudyTab(tab.key)}
              >
                <i className={`fas ${tab.icon}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="ayah-study-content">{renderStudyContent()}</div>
        </div>
      )}

      {showShare && (
        <div className="ayah-action-sheet ayah-action-sheet--share">
          <div className="ayah-action-sheet__header">
            <div>
              <div className="ayah-action-sheet__eyebrow">
                {lang === "fr"
                  ? "Partage premium"
                  : lang === "ar"
                    ? "مشاركة مميزة"
                    : "Premium sharing"}
              </div>
              <div className="ayah-action-sheet__title">
                {lang === "fr"
                  ? "Exporter cette ayah"
                  : lang === "ar"
                    ? "شارك هذه الآية"
                    : "Export this ayah"}
              </div>
            </div>
            <button
              type="button"
              className="ayah-action-sheet__close"
              onClick={closePanels}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          <p className="ayah-action-sheet__copy">
            {lang === "fr"
              ? "Choisissez une sortie rapide: texte, reseau social, image classique ou carte calligraphique."
              : lang === "ar"
                ? "اختر مخرجاً سريعاً: نص، شبكة اجتماعية، صورة كلاسيكية أو بطاقة خطية."
                : "Choose a quick output: text, social app, classic image, or calligraphic card."}
          </p>

          <div className="ayah-actions__sheet-grid">
            <button className="share-btn share-btn--whatsapp" onClick={shareWhatsApp}>
              <i className="fab fa-whatsapp" />
              <span className="share-btn__label">WhatsApp</span>
            </button>
            <button className="share-btn share-btn--telegram" onClick={shareTelegram}>
              <i className="fab fa-telegram-plane" />
              <span className="share-btn__label">Telegram</span>
            </button>
            <button className="share-btn share-btn--x" onClick={shareTwitter}>
              <i className="fab fa-x-twitter" />
              <span className="share-btn__label">X / Twitter</span>
            </button>
            <button className="share-btn share-btn--email" onClick={shareEmail}>
              <i className="fas fa-envelope" />
              <span className="share-btn__label">Email</span>
            </button>
            <button className="share-btn share-btn--copy" onClick={shareCopyText}>
              <i className="fas fa-copy" />
              <span className="share-btn__label">
                {lang === "fr" ? "Texte de partage" : lang === "ar" ? "نسخ النص" : "Copy share text"}
              </span>
            </button>
            <button className="share-btn share-btn--image" onClick={shareAsImage}>
              <i className="fas fa-image" />
              <span className="share-btn__label">
                {lang === "fr" ? "Image sobre" : lang === "ar" ? "صورة" : "Simple image"}
              </span>
            </button>
            <button
              className="share-btn share-btn--card"
              onClick={() => {
                dispatch({ type: "SET", payload: { shareImageOpen: true } });
                closePanels();
              }}
            >
              <i className="fas fa-wand-magic-sparkles" />
              <span className="share-btn__label">
                {lang === "fr"
                  ? "Carte calligraphique"
                  : lang === "ar"
                    ? "بطاقة خطية"
                    : "Calligraphic card"}
              </span>
            </button>
            {navigator.share && (
              <button className="share-btn share-btn--native" onClick={shareNative}>
                <i className="fas fa-share-nodes" />
                <span className="share-btn__label">
                  {lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Native share"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {showPlaylistMenu && (
        <div className="ayah-action-sheet ayah-action-sheet--playlist">
          <div className="ayah-action-sheet__header">
            <div>
              <div className="ayah-action-sheet__eyebrow">
                {lang === "fr"
                  ? "Hub audio"
                  : lang === "ar"
                    ? "مركز الصوت"
                    : "Audio hub"}
              </div>
              <div className="ayah-action-sheet__title">
                {lang === "fr"
                  ? "Ajouter a une playlist"
                  : lang === "ar"
                    ? "أضف إلى قائمة"
                    : "Add to a playlist"}
              </div>
            </div>
            <button
              type="button"
              className="ayah-action-sheet__close"
              onClick={closePanels}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="ayah-action-sheet__empty">
              {lang === "fr"
                ? "Aucune playlist encore. Creez-en une depuis le panneau Playlists."
                : lang === "ar"
                  ? "لا توجد قوائم بعد. أنشئ قائمة من لوحة القوائم."
                  : "No playlist yet. Create one from the Playlists panel."}
            </div>
          ) : (
            <div className="ayah-actions__sheet-grid">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
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
                      toastText(
                        "Ayah ajoutee a la playlist",
                        "تمت إضافة الآية إلى القائمة",
                        "Ayah added to playlist",
                      ),
                    );
                    window.setTimeout(() => setPlaylistAdded(false), 1800);
                  }}
                >
                  <i className="fas fa-music" />
                  <span>
                    {playlist.name} ({playlist.ayahs.length})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showNote && (
        <div className="ayah-action-sheet ayah-action-sheet--note">
          <div className="ayah-action-sheet__header">
            <div>
              <div className="ayah-action-sheet__eyebrow">
                {lang === "fr"
                  ? "Note de meditation"
                  : lang === "ar"
                    ? "ملاحظة تدبر"
                    : "Reflection note"}
              </div>
              <div className="ayah-action-sheet__title">
                {lang === "fr"
                  ? "Ecrire sur cette ayah"
                  : lang === "ar"
                    ? "اكتب حول هذه الآية"
                    : "Write on this ayah"}
              </div>
            </div>
            <button
              type="button"
              className="ayah-action-sheet__close"
              onClick={closePanels}
            >
              <i className="fas fa-times" />
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

          <textarea
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
