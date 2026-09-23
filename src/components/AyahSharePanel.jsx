import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Check,
  Clipboard,
  ImageDown,
  Languages,
  Loader2,
  RotateCw,
  Share2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { getSurah } from "../data/surahs";
import { t } from "../i18n";
import { sanitizeSvgMarkup } from "../lib/security";
import { cleanShareText, createVerseSharePayload } from "../services/verseShareService";

export const VERSE_CARD_FORMATS = [
  { id: "square", label: "Carré", detail: "Publication", width: 1080, height: 1080 },
  { id: "portrait", label: "Portrait", detail: "Fil social", width: 1080, height: 1350 },
  { id: "story", label: "Story", detail: "Plein écran", width: 1080, height: 1920 },
];

export const VERSE_CARD_PRESETS = [
  {
    id: "fajr",
    label: "Lueur du Fajr",
    background: "#f8f6ef",
    surface: "#edf3ee",
    ink: "#18362e",
    arabic: "#0a6846",
    accent: "#b88b38",
    muted: "#607169",
  },
  {
    id: "mushaf",
    label: "Parchemin",
    background: "#efe3cb",
    surface: "#f8eedb",
    ink: "#493522",
    arabic: "#6b451f",
    accent: "#a36d25",
    muted: "#78654d",
  },
  {
    id: "madinah",
    label: "Nuit de Médine",
    background: "#071a16",
    surface: "#0d2922",
    ink: "#f3eee2",
    arabic: "#74dfb5",
    accent: "#d4ad58",
    muted: "#a7bbb3",
  },
];

function escapeSvgText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapWords(value, maxChars, maxLines) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = `${visible[maxLines - 1].replace(/[.…]+$/u, "")}…`;
  return visible;
}

function lineText(lines, { x, startY, lineHeight, fontSize, fill, family, direction }) {
  return lines
    .map(
      (line, index) => `<text x="${x}" y="${startY + index * lineHeight}" text-anchor="middle" direction="${direction}" unicode-bidi="plaintext" font-family="${family}" font-size="${fontSize}" fill="${fill}">${escapeSvgText(line)}</text>`,
    )
    .join("");
}

function buildGeometry(width, height, preset) {
  const inset = Math.round(width * 0.043);
  const corner = Math.round(width * 0.09);
  const center = width / 2;
  const diamonds = Array.from({ length: 9 }, (_, index) => {
    const x = width * 0.12 + index * width * 0.095;
    return `<path d="M ${x} ${height - inset} l 7 -7 l 7 7 l -7 7 z" fill="${preset.accent}" opacity="0.34"/>`;
  }).join("");

  return `
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="34" fill="none" stroke="${preset.accent}" stroke-width="2" opacity="0.72"/>
    <rect x="${inset + 14}" y="${inset + 14}" width="${width - (inset + 14) * 2}" height="${height - (inset + 14) * 2}" rx="26" fill="none" stroke="${preset.accent}" stroke-width="1" opacity="0.24"/>
    <path d="M ${center - corner} ${inset + 44} Q ${center} ${inset - 8} ${center + corner} ${inset + 44}" fill="none" stroke="${preset.accent}" stroke-width="2" opacity="0.58"/>
    <path d="M ${inset} ${inset + corner} L ${inset + corner} ${inset} M ${width - inset} ${inset + corner} L ${width - inset - corner} ${inset}" fill="none" stroke="${preset.accent}" stroke-width="2" opacity="0.46"/>
    <circle cx="${center}" cy="${inset + 44}" r="8" fill="${preset.accent}" opacity="0.78"/>
    ${diamonds}
  `;
}

/*
 * The Arabic stack of the card follows the riwaya of the verse it quotes: a
 * Warsh card set in a Hafs face drops the Warsh signs, and vice versa.
 * src/styles/riwaya-fonts.css owns those stacks as the --font-quran-hafs /
 * --font-quran-warsh tokens, so the value is read from the document instead of
 * being restated here. The card is rasterised as a standalone SVG image, which
 * cannot resolve a CSS custom property from the page cascade, hence the one
 * read plus a literal fallback for the non-browser case.
 */
const CARD_ARABIC_FONT_TOKENS = {
  hafs: "--font-quran-hafs",
  warsh: "--font-quran-warsh",
};

const CARD_ARABIC_FONT_FALLBACK = {
  hafs: "'KFGQPC Uthmanic Script HAFS','Amiri Quran','Amiri',serif",
  warsh: "'KFGQPC Warsh','QPC Warsh','Scheherazade New','Amiri Quran',serif",
};

function resolveCardArabicFontFamily(riwaya) {
  const target = riwaya === "warsh" ? "warsh" : "hafs";
  if (typeof window === "undefined") return CARD_ARABIC_FONT_FALLBACK[target];
  const token = CARD_ARABIC_FONT_TOKENS[target];
  const declared = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim()
    // Emitted inside a double-quoted SVG attribute.
    .replace(/"/g, "'");
  return declared || CARD_ARABIC_FONT_FALLBACK[target];
}

/**
 * The card is rasterised as a standalone SVG image, which cannot see the page's
 * @font-face rules: without an embedded copy the Quran text is drawn in whatever
 * Arabic face the OS offers. One face per riwaya, read from our own same-origin
 * stylesheets and cached.
 */
const CARD_FONT_MAX_BYTES = 512 * 1024;
const cardFontCache = new Map();

function splitFontStack(stack) {
  return String(stack || "")
    .split(",")
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function findSameOriginFontUrl(family) {
  if (typeof document === "undefined") return null;
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of rules || []) {
      if (rule.type !== 5) continue;
      const declared = rule.style
        .getPropertyValue("font-family")
        .replace(/^['"]|['"]$/g, "")
        .trim();
      if (declared !== family) continue;
      const match = /url\((['"]?)([^'")]+)\1\)/.exec(
        rule.style.getPropertyValue("src"),
      );
      if (!match) continue;
      const url = new URL(match[2], sheet.href || document.baseURI);
      if (url.origin !== window.location.origin) continue;
      return url.href;
    }
  }
  return null;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  }
  return btoa(binary);
}

const FONT_FORMATS = {
  woff2: ["woff2", "font/woff2"],
  woff: ["woff", "font/woff"],
  ttf: ["truetype", "font/ttf"],
  otf: ["opentype", "font/otf"],
};

function fontFormat(href) {
  const extension = /\.(\w+)(?:\?|#|$)/.exec(href)?.[1]?.toLowerCase();
  return FONT_FORMATS[extension];
}

async function loadCardFontCss(riwaya) {
  const target = riwaya === "warsh" ? "warsh" : "hafs";
  if (cardFontCache.has(target)) return cardFontCache.get(target);
  let css = "";
  for (const family of splitFontStack(resolveCardArabicFontFamily(target))) {
    const safeFamily = family.replace(/[^A-Za-z0-9 _-]/g, "");
    if (!safeFamily) continue;
    const href = findSameOriginFontUrl(family);
    const faceFormat = href && fontFormat(href);
    if (!faceFormat) continue;
    try {
      const response = await fetch(href);
      if (!response.ok) continue;
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.byteLength || bytes.byteLength > CARD_FONT_MAX_BYTES) continue;
      const [format, mime] = faceFormat;
      css = `@font-face{font-family:'${safeFamily}';src:url(data:${mime};base64,${bytesToBase64(bytes)}) format('${format}');}`;
      break;
    } catch {
      // The card still rasterises with the system Arabic face.
    }
  }
  cardFontCache.set(target, css);
  return css;
}

function buildRiwayaLine({ width, preset, riwayaLabel, riwayaLabelRtl }) {
  if (!riwayaLabel) return "";
  const x = Math.round(width * 0.5);
  return `<text x="${x}" y="205" text-anchor="middle" direction="${riwayaLabelRtl ? "rtl" : "ltr"}" unicode-bidi="plaintext" font-family="'Cairo','Segoe UI',sans-serif" font-size="19" letter-spacing="${riwayaLabelRtl ? 0 : 1.5}" fill="${preset.muted}">${escapeSvgText(riwayaLabel)}</text>`;
}

export function buildVerseCardSvg({
  arabicText,
  translationText,
  includeTranslation,
  surahNameAr,
  surahNameLabel,
  surahNumber,
  ayahNumber,
  presetId = "fajr",
  formatId = "square",
  arabicFontFamily,
  riwayaLabel = "",
  riwayaLabelRtl = false,
}) {
  const preset = VERSE_CARD_PRESETS.find((item) => item.id === presetId) || VERSE_CARD_PRESETS[0];
  const format = VERSE_CARD_FORMATS.find((item) => item.id === formatId) || VERSE_CARD_FORMATS[0];
  const { width, height } = format;
  const arabicFamily = arabicFontFamily || resolveCardArabicFontFamily("hafs");
  const isStory = formatId === "story";
  const isSquare = formatId === "square";
  const arabicLines = wrapWords(arabicText, isStory ? 29 : 32, isSquare ? 6 : isStory ? 10 : 8);
  const translationLines = includeTranslation
    ? wrapWords(translationText, isStory ? 48 : 55, isSquare ? 4 : isStory ? 7 : 5)
    : [];
  const contentTop = isStory ? 270 : 220;
  const contentBottom = height - 130;
  const availableHeight = contentBottom - contentTop;
  const translationSize = isStory ? 30 : 26;
  const translationLineHeight = Math.round(translationSize * 1.52);
  const translationHeight = translationLines.length * translationLineHeight;
  const dividerGap = translationLines.length ? (isStory ? 86 : 72) : 0;
  const arabicSpace = availableHeight - translationHeight - dividerGap;
  const arabicSize = Math.round(Math.max(42, Math.min(76, arabicSpace / Math.max(1, arabicLines.length * 1.55))));
  const arabicLineHeight = Math.round(arabicSize * 1.55);
  const contentHeight = arabicLines.length * arabicLineHeight + dividerGap + translationHeight;
  const contentStart = contentTop + Math.max(0, Math.round((availableHeight - contentHeight) / 2));
  const arabicStart = contentStart + arabicSize;
  const arabicEnd = arabicStart + Math.max(0, arabicLines.length - 1) * arabicLineHeight;
  const dividerY = arabicEnd + (translationLines.length ? 42 : 0);
  const translationStart = dividerY + 54;
  const refLabel = `${surahNameLabel || `Sourate ${surahNumber}`} · ${surahNumber}:${ayahNumber}`;
  const arabicLabel = surahNameAr ? `سورة ${surahNameAr}` : "آية من القرآن الكريم";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${preset.background}"/>
      <stop offset="0.52" stop-color="${preset.surface}"/>
      <stop offset="1" stop-color="${preset.background}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="22%" r="68%">
      <stop offset="0" stop-color="${preset.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${preset.background}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#paper)"/>
  <rect width="${width}" height="${height}" fill="url(#halo)"/>
  ${buildGeometry(width, height, preset)}
  <text x="${width / 2}" y="128" text-anchor="middle" direction="rtl" font-family="'Amiri Quran','Amiri',serif" font-size="32" fill="${preset.arabic}">${escapeSvgText(arabicLabel)}</text>
  <text x="${width / 2}" y="181" text-anchor="middle" font-family="'Cairo','Segoe UI',sans-serif" font-size="24" letter-spacing="3" fill="${preset.muted}">${escapeSvgText(refLabel.toUpperCase())}</text>
  ${buildRiwayaLine({ width, preset, riwayaLabel, riwayaLabelRtl })}
  <line x1="${width * 0.34}" y1="218" x2="${width * 0.66}" y2="218" stroke="${preset.accent}" stroke-width="2" opacity="0.58"/>
  ${lineText(arabicLines, {
    x: width / 2,
    startY: arabicStart,
    lineHeight: arabicLineHeight,
    fontSize: arabicSize,
    fill: preset.ink,
    family: arabicFamily,
    direction: "rtl",
  })}
  ${translationLines.length ? `<rect x="80" y="${dividerY + 14}" width="${width - 160}" height="${translationHeight + 54}" rx="28" fill="${preset.surface}" opacity="0.72"/><line x1="${width * 0.42}" y1="${dividerY}" x2="${width * 0.58}" y2="${dividerY}" stroke="${preset.accent}" stroke-width="2" opacity="0.72"/>` : ""}
  ${lineText(translationLines, {
    x: width / 2,
    startY: translationStart,
    lineHeight: translationLineHeight,
    fontSize: translationSize,
    fill: preset.muted,
    family: "'Cairo','Segoe UI',sans-serif",
    direction: "ltr",
  })}
  <text x="${width / 2}" y="${height - 92}" text-anchor="middle" font-family="Georgia,serif" font-size="26" font-weight="700" letter-spacing="1" fill="${preset.arabic}">MushafPlus</text>
  <text x="${width / 2}" y="${height - 58}" text-anchor="middle" font-family="'Cairo','Segoe UI',sans-serif" font-size="18" letter-spacing="2" fill="${preset.muted}">LE CORAN · SIMPLEMENT</text>
</svg>`;
}

async function svgToPngBlob(svg, width, height) {
  await document.fonts?.ready;
  const source = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(source);

  try {
    const image = await new Promise((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image, 0, 0, width, height);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG unavailable"))),
        "image/png",
        0.96,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function localizedCopy(lang) {
  if (lang === "ar") {
    return {
      title: "مشاركة الآية كصورة",
      subtitle: "صمّم بطاقة قرآنية ثم شاركها مباشرة",
      format: "المقاس",
      style: "التصميم",
      translation: "الترجمة",
      include: "إظهار الترجمة",
      share: "مشاركة الصورة",
      download: "تنزيل PNG",
      copy: "نسخ الصورة",
      copied: "تم نسخ الصورة",
      downloaded: "تم تنزيل الصورة",
      fallback: "التطبيق لا يدعم مشاركة الملفات؛ تم تنزيل الصورة.",
      error: "تعذّر إنشاء الصورة",
      preview: "معاينة بطاقة الآية",
    };
  }
  if (lang === "en") {
    return {
      title: "Share the verse as an image",
      subtitle: "Create a Quran card, then share it directly",
      format: "Format",
      style: "Design",
      translation: "Translation",
      include: "Show translation",
      share: "Share image",
      download: "Download PNG",
      copy: "Copy image",
      copied: "Image copied",
      downloaded: "Image downloaded",
      fallback: "File sharing is unavailable here, so the image was downloaded.",
      error: "The image could not be created",
      preview: "Verse card preview",
    };
  }
  return {
    title: "Partager le verset en image",
    subtitle: "Créez une carte coranique, puis partagez-la directement",
    format: "Format",
    style: "Design",
    translation: "Traduction",
    include: "Afficher la traduction",
    share: "Partager l’image",
    download: "Télécharger le PNG",
    copy: "Copier l’image",
    copied: "Image copiée",
    downloaded: "Image téléchargée",
    fallback: "Le partage de fichier n’est pas disponible ici : l’image a été téléchargée.",
    error: "Impossible de créer l’image",
    preview: "Aperçu de la carte du verset",
  };
}

export default function AyahSharePanel() {
  const { state, dispatch } = useApp();
  const { lang, currentSurah, currentAyah, theme, shareVerseDraft } = state;
  const labels = localizedCopy(lang);
  const draft = shareVerseDraft || {};
  const surahNumber = Number(draft.surah) || Number(currentSurah) || 1;
  const ayahNumber = Number(draft.ayah) || Number(currentAyah) || 1;
  // The card prints the number the reader displays; the text deep link keeps
  // the storage coordinate the routes and bookmarks are keyed on.
  const displayAyahNumber = Number(draft.displayAyah) || ayahNumber;
  const draftRiwaya = (draft.riwaya || state.riwaya) === "warsh" ? "warsh" : "hafs";
  const surahData = getSurah(surahNumber);
  const initialPreset = theme === "dark" ? "madinah" : theme === "sepia" ? "mushaf" : "fajr";
  const [presetId, setPresetId] = useState(initialPreset);
  const [formatId, setFormatId] = useState("square");
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [retryState, setRetryState] = useState("idle");

  const close = useCallback(() => {
    dispatch({ type: "SET", payload: { shareImageOpen: false, shareVerseDraft: null } });
  }, [dispatch]);

  // Data-layer text only. The card is never filled from the DOM again: a
  // scraped miss used to fall through to the Basmala under a valid reference.
  const arabicText = useMemo(() => cleanShareText(draft.arabicText), [draft.arabicText]);
  const translationText = useMemo(
    () => cleanShareText(draft.translationText),
    [draft.translationText],
  );
  const verseUnavailable = !arabicText;

  // Retry asks the ayah actions row that opened this studio to re-publish the
  // verse it still has in hand.
  const retryVerseText = useCallback(() => {
    setRetryState("pending");
    window.dispatchEvent(new CustomEvent("ayah-share-refresh", {
      detail: { surah: surahNumber, ayah: ayahNumber },
    }));
  }, [ayahNumber, surahNumber]);

  useEffect(() => {
    if (retryState !== "pending") return undefined;
    if (arabicText) {
      setRetryState("idle");
      return undefined;
    }
    const timer = window.setTimeout(() => setRetryState("idle"), 1500);
    return () => window.clearTimeout(timer);
  }, [arabicText, retryState]);

  const format = VERSE_CARD_FORMATS.find((item) => item.id === formatId) || VERSE_CARD_FORMATS[0];
  const surahNameLabel =
    lang === "ar" ? surahData?.ar : lang === "en" ? surahData?.en : surahData?.fr;
  const sharePayload = useMemo(
    () => createVerseSharePayload({
      surah: surahNumber,
      ayah: ayahNumber,
      arabicText,
      translationText: includeTranslation ? translationText : "",
      surahName: surahNameLabel,
      lang,
    }),
    [arabicText, ayahNumber, includeTranslation, lang, surahNameLabel, surahNumber, translationText],
  );
  const arabicFontFamily = useMemo(
    () => resolveCardArabicFontFamily(draftRiwaya),
    [draftRiwaya],
  );
  const riwayaLabel = t(draftRiwaya === "warsh" ? "quran.warsh" : "quran.hafs", lang);
  const [cardFontCss, setCardFontCss] = useState("");
  useEffect(() => {
    let active = true;
    loadCardFontCss(draftRiwaya).then((css) => {
      if (active) setCardFontCss(css);
    });
    return () => {
      active = false;
    };
  }, [draftRiwaya]);
  const svgContent = useMemo(
    () => (verseUnavailable ? "" : buildVerseCardSvg({
      arabicText,
      translationText,
      includeTranslation,
      surahNameAr: surahData?.ar,
      surahNameLabel,
      surahNumber,
      ayahNumber: displayAyahNumber,
      presetId,
      formatId,
      arabicFontFamily,
      riwayaLabel,
      riwayaLabelRtl: lang === "ar",
    })),
    [
      arabicFontFamily,
      arabicText,
      displayAyahNumber,
      formatId,
      includeTranslation,
      lang,
      presetId,
      riwayaLabel,
      surahData?.ar,
      surahNameLabel,
      surahNumber,
      translationText,
      verseUnavailable,
    ],
  );
  const safeSvgContent = useMemo(() => {
    if (!svgContent) return "";
    const cleaned = sanitizeSvgMarkup(svgContent);
    if (!cleaned || !cardFontCss) return cleaned;
    // The sanitizer blocks <style> on purpose; this block is ours, built from a
    // family name filtered to [A-Za-z0-9 _-] and base64 font bytes.
    return cleaned.replace(
      /^<svg\b[^>]*>/,
      (open) => `${open}<style>${cardFontCss}</style>`,
    );
  }, [cardFontCss, svgContent]);
  const previewUrl = safeSvgContent
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(safeSvgContent)}`
    : "";
  const filename = `mushafplus-${surahNumber}-${displayAyahNumber}-${formatId}.png`;

  const createPng = useCallback(
    () => svgToPngBlob(safeSvgContent, format.width, format.height),
    [format.height, format.width, safeSvgContent],
  );

  const runAction = useCallback(async (action, callback) => {
    if (verseUnavailable) return;
    setBusyAction(action);
    setFeedback("");
    try {
      await callback();
    } catch (error) {
      if (error?.name !== "AbortError") setFeedback(labels.error);
    } finally {
      setBusyAction("");
    }
  }, [labels.error, verseUnavailable]);

  const handleShare = () => runAction("share", async () => {
    const blob = await createPng();
    const file = new File([blob], filename, { type: "image/png" });
    const canShareFile = Boolean(
      navigator.share && navigator.canShare?.({ files: [file] }),
    );
    if (canShareFile) {
      await navigator.share({ files: [file], title: sharePayload.title });
      return;
    }
    downloadBlob(blob, filename);
    setFeedback(labels.fallback);
  });

  const handleDownload = () => runAction("download", async () => {
    downloadBlob(await createPng(), filename);
    setFeedback(labels.downloaded);
  });

  const handleCopyImage = () => runAction("copy", async () => {
    const blob = await createPng();
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      downloadBlob(blob, filename);
      setFeedback(labels.fallback);
      return;
    }
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setFeedback(labels.copied);
  });

  return (
    <Dialog.Root open onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <div className="modal-overlay share-studio-overlay" onClick={close}>
          <Dialog.Content
            className="modal share-panel share-studio"
            aria-describedby="verse-share-description"
            onClick={(event) => event.stopPropagation()}
            onEscapeKeyDown={close}
            onInteractOutside={close}
          >
            <header className="share-studio__header">
              <div className="share-studio__heading">
                <span className="share-studio__kicker"><Share2 size={13} /> {surahNameLabel} · {surahNumber}:{displayAyahNumber}</span>
                <Dialog.Title>{labels.title}</Dialog.Title>
                <Dialog.Description id="verse-share-description">{labels.subtitle}</Dialog.Description>
              </div>
              <button type="button" className="modal-close share-studio__close" onClick={close} aria-label={t("share.close", lang)}>
                <X size={16} />
              </button>
            </header>

            <div className="share-studio__workspace">
              <section className="share-studio__preview-column" aria-label={labels.preview}>
                <div className="share-studio__preview-stage">
                  {verseUnavailable ? (
                    <div
                      className="share-studio__unavailable flex h-full min-h-56 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-amber-500/45 bg-amber-500/10 p-5 text-center"
                      role="alert"
                      aria-busy={retryState === "pending" || undefined}
                    >
                      <TriangleAlert size={22} className="text-amber-600" aria-hidden="true" />
                      <strong className="text-sm font-extrabold text-[var(--text-primary)]">{t("share.verseUnavailable", lang)}</strong>
                      <span className="text-xs font-bold tabular-nums text-[var(--text-muted)]" dir="ltr">{surahNumber}:{displayAyahNumber}</span>
                      <p className="max-w-[34ch] text-xs leading-relaxed text-[var(--text-secondary)]">{t("share.verseUnavailableHint", lang)}</p>
                      <button
                        type="button"
                        className="share-action-btn share-action-btn--secondary mt-1 min-h-11"
                        onClick={retryVerseText}
                        disabled={retryState === "pending"}
                      >
                        {retryState === "pending"
                          ? <Loader2 className="animate-spin" size={15} aria-hidden="true" />
                          : <RotateCw size={15} aria-hidden="true" />}
                        <span>{t("actions.retry", lang)}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="share-studio__preview-frame" style={{ aspectRatio: `${format.width} / ${format.height}` }}>
                      <img src={previewUrl} alt={labels.preview} />
                    </div>
                  )}
                </div>
              </section>

              <section className="share-studio__controls">
                <fieldset className="share-control-group">
                  <legend>{labels.format}</legend>
                  <div className="share-format-picker">
                    {VERSE_CARD_FORMATS.map((item) => (
                      <button key={item.id} type="button" className={formatId === item.id ? "is-active" : ""} onClick={() => setFormatId(item.id)} aria-pressed={formatId === item.id}>
                        <span className={`share-format-icon share-format-icon--${item.id}`} aria-hidden="true" />
                        <strong>{item.label}</strong>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="share-control-group">
                  <legend>{labels.style}</legend>
                  <div className="share-theme-picker">
                    {VERSE_CARD_PRESETS.map((item) => (
                      <button key={item.id} type="button" className={presetId === item.id ? "is-active" : ""} onClick={() => setPresetId(item.id)} aria-pressed={presetId === item.id}>
                        <span className="share-theme-swatch" style={{ "--share-swatch-bg": item.background, "--share-swatch-ink": item.arabic, "--share-swatch-gold": item.accent }} aria-hidden="true" />
                        <span>{item.label}</span>
                        {presetId === item.id ? <Check size={13} aria-hidden="true" /> : null}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="share-studio__quick-setting">
                  <span><Languages size={14} /> {labels.translation}</span>
                  <button type="button" className={`share-toggle ${includeTranslation ? "on" : "off"}`} onClick={() => setIncludeTranslation((value) => !value)} aria-pressed={includeTranslation}>
                    <span aria-hidden="true" /> {labels.include}
                  </button>
                </div>

              </section>
            </div>

            <footer className="share-studio__footer">
              <div className={`share-studio__feedback ${feedback ? "is-visible" : ""}`} role="status" aria-live="polite">{feedback}</div>
              <div className="share-actions">
                <button type="button" className="share-action-btn share-action-btn--secondary share-action-btn--icon" onClick={handleCopyImage} disabled={Boolean(busyAction) || verseUnavailable} aria-label={labels.copy} title={labels.copy}>
                  {busyAction === "copy" ? <Loader2 className="animate-spin" size={15} /> : <Clipboard size={15} />}
                  <span>{labels.copy}</span>
                </button>
                <button type="button" className="share-action-btn share-action-btn--secondary share-action-btn--icon" onClick={handleDownload} disabled={Boolean(busyAction) || verseUnavailable} aria-label={labels.download} title={labels.download}>
                  {busyAction === "download" ? <Loader2 className="animate-spin" size={15} /> : <ImageDown size={15} />}
                  <span>{labels.download}</span>
                </button>
                <button type="button" className="share-action-btn share-action-btn--primary" onClick={handleShare} disabled={Boolean(busyAction) || verseUnavailable}>
                  {busyAction === "share" ? <Loader2 className="animate-spin" size={16} /> : <Share2 size={16} />}
                  <span>{labels.share}</span>
                </button>
              </div>
            </footer>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
