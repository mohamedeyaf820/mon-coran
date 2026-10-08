import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Check,
  Clipboard,
  Frame,
  ImageDown,
  Loader2,
  Palette,
  RotateCw,
  Share2,
  Shapes,
  TriangleAlert,
  Type,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { getSurah, getSurahLigature } from "../data/surahs";
import { t } from "../i18n";
import { sanitizeSvgMarkup } from "../lib/security";
import { applyFontSigns } from "../utils/quranUtils";
import { cleanShareText, createVerseSharePayload, DEFAULT_SHARE_ORIGIN } from "../services/verseShareService";
import { fetchWithTimeout } from "../services/fetchWithTimeout.js";
import {
  VERSE_CARD_FORMATS,
  VERSE_CARD_FRAMES,
  VERSE_CARD_MOTIFS,
  VERSE_CARD_PRESETS,
  VERSE_CARD_TEXT_SCALES,
  buildVerseCardSvg,
  buildVerseCardThumbSvg,
  isDarkPreset,
} from "./share/verseCardSvg";
import "../styles/share-studio.css";



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
  hafs: "'QPC Hafs','Amiri Quran','Amiri',serif",
  warsh: "'KFGQPC Warsh','Scheherazade New','Amiri Quran',serif",
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
// A stalled font fetch would pin the share-card await forever and cache the
// empty result, so the card silently loses its Quran face for the session.
const CARD_FONT_FETCH_TIMEOUT = 8000;
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
      const response = await fetchWithTimeout(href, {}, CARD_FONT_FETCH_TIMEOUT);
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

/*
 * The surah-name calligraphy is the identity face the reader already knows
 * from the header, sidebar and home cards. Without the embedded bytes the
 * ligature code points would rasterise as "001" digits, so callers must treat
 * an empty string as "keep the Amiri surah line instead".
 */
async function loadSurahNamesFontCss() {
  const target = "surahnames";
  if (cardFontCache.has(target)) return cardFontCache.get(target);
  let css = "";
  try {
    const href = findSameOriginFontUrl(target);
    const faceFormat = href && fontFormat(href);
    if (faceFormat) {
      const response = await fetchWithTimeout(href, {}, CARD_FONT_FETCH_TIMEOUT);
      if (response.ok) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.byteLength && bytes.byteLength <= CARD_FONT_MAX_BYTES) {
          const [format, mime] = faceFormat;
          css = `@font-face{font-family:'${target}';src:url(data:${mime};base64,${bytesToBase64(bytes)}) format('${format}');}`;
        }
      }
    }
  } catch {
    // The card falls back to the Amiri surah line, as before.
  }
  cardFontCache.set(target, css);
  return css;
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
      customize: "تخصيص البطاقة",
      tabs: { models: "التصاميم", frame: "الإطار", motif: "النقش", text: "النص" },
      style: "التصميم",
      frame: "الإطار",
      motif: "النقش",
      textSize: "حجم النص",
      content: "المحتوى",
      translation: "الترجمة",
      riwaya: "الرواية",
      branding: "التوقيع",
      groups: { light: "فاتحة", dark: "داكنة" },
      frames: { classic: "كلاسيكي", fine: "رفيع", corners: "زوايا مذهّبة", frieze: "إفريز", arch: "محراب", ogee: "عقد مدبّب", zellige: "زليج", ribbon: "لوحة", scrolls: "زخارف ملتفة", none: "بلا إطار" },
      motifs: { none: "بدون", star: "نجوم", lattice: "شبك", medallion: "وردة", dunes: "كثبان", flowers: "أزهار", arabesque: "أرابيسك", skyline: "مسجد", night: "ليل مرصّع" },
      scales: { compact: "مضغوط", balanced: "متوازن", large: "كبير" },
      formats: { square: "مربّع", portrait: "طولي", story: "ستوري" },
      presets: {
        fajr: "نور الفجر",
        emeraude: "زمرّد",
        mushaf: "الرقّ",
        madinah: "ليل المدينة",
        ivoire: "عاجي",
        "nuit-or": "ليل وذهب",
        sauge: "ميرمية",
        azur: "أزرق إزنيق",
        aube: "فجر وردي",
        cordoue: "قرطبة",
        doua: "دعاء",
        encre: "حِبر",
        kiswa: "الكسوة",
        crepuscule: "الغسق",
        desert: "صحراء",
        menthe: "نعناع",
        lapis: "لازورد",
        aurore: "شروق",
      },
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
      customize: "Customize the card",
      tabs: { models: "Designs", frame: "Frame", motif: "Pattern", text: "Text" },
      style: "Design",
      frame: "Frame",
      motif: "Pattern",
      textSize: "Arabic text",
      content: "Content",
      translation: "Translation",
      riwaya: "Riwaya",
      branding: "Signature",
      groups: { light: "Light", dark: "Dark" },
      frames: { classic: "Classic", fine: "Fine", corners: "Gilded corners", frieze: "Frieze", arch: "Mihrab", ogee: "Ogee arch", zellige: "Zellige", ribbon: "Plaque", scrolls: "Scrollwork", none: "No frame" },
      motifs: { none: "None", star: "Stars", lattice: "Lattice", medallion: "Rosette", dunes: "Dunes", flowers: "Flowers", arabesque: "Arabesque", skyline: "Mosque", night: "Starry night" },
      scales: { compact: "Compact", balanced: "Balanced", large: "Large" },
      formats: { square: "Square", portrait: "Portrait", story: "Story" },
      presets: {
        fajr: "Fajr glow",
        emeraude: "Emerald",
        mushaf: "Parchment",
        madinah: "Madinah night",
        ivoire: "Ivory",
        "nuit-or": "Night & gold",
        sauge: "Sage",
        azur: "Iznik blue",
        aube: "Rose dawn",
        cordoue: "Córdoba",
        doua: "Dua",
        encre: "Ink",
        kiswa: "Kiswa",
        crepuscule: "Dusk",
        desert: "Desert",
        menthe: "Mint",
        lapis: "Lapis",
        aurore: "Dawn",
      },
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
    customize: "Personnaliser la carte",
    tabs: { models: "Modèles", frame: "Cadre", motif: "Motif", text: "Texte" },
    style: "Design",
    frame: "Cadre",
    motif: "Motif",
    textSize: "Texte arabe",
    content: "Contenu",
    translation: "Traduction",
    riwaya: "Riwaya",
    branding: "Signature",
    groups: { light: "Clairs", dark: "Sombres" },
    frames: { classic: "Classique", fine: "Fin", corners: "Coins dorés", frieze: "Frise", arch: "Mihrab", ogee: "Ogive", zellige: "Zellige", ribbon: "Plaque", scrolls: "Enroulements", none: "Sans cadre" },
    motifs: { none: "Aucun", star: "Étoiles", lattice: "Treillis", medallion: "Rosace", dunes: "Dunes", flowers: "Fleurs", arabesque: "Arabesques", skyline: "Mosquée", night: "Nuit étoilée" },
    scales: { compact: "Compact", balanced: "Équilibré", large: "Grand" },
    formats: { square: "Carré", portrait: "Portrait", story: "Story" },
    presets: {
      fajr: "Lueur du Fajr",
      emeraude: "Émeraude",
      mushaf: "Parchemin",
      madinah: "Nuit de Médine",
      ivoire: "Ivoire",
      "nuit-or": "Nuit & Or",
      sauge: "Sauge",
      azur: "Azur d’Iznik",
      aube: "Aube rosée",
      cordoue: "Cordoue",
      doua: "Doua",
      encre: "Encre",
      kiswa: "Kiswa",
      crepuscule: "Crépuscule",
      desert: "Désert",
      menthe: "Menthe",
      lapis: "Lapis",
      aurore: "Aurore",
    },
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

// An invocation is not a verse: the studio says so in its title and preview label.
const DUA_COPY = {
  fr: {
    title: "Partager l’invocation en image",
    subtitle: "Créez une carte, puis partagez-la directement",
    preview: "Aperçu de la carte de l’invocation",
  },
  en: {
    title: "Share the supplication as an image",
    subtitle: "Create a card, then share it directly",
    preview: "Supplication card preview",
  },
  ar: {
    title: "مشاركة الدعاء كصورة",
    subtitle: "صمّم بطاقة ثم شاركها مباشرة",
    preview: "معاينة بطاقة الدعاء",
  },
};

const STUDIO_TABS = [
  { id: "models", Icon: Palette },
  { id: "frame", Icon: Frame },
  { id: "motif", Icon: Shapes },
  { id: "text", Icon: Type },
];

function svgDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function AyahSharePanel() {
  const { state, dispatch } = useApp();
  const { lang, currentSurah, currentAyah, theme, shareVerseDraft } = state;
  const draft = shareVerseDraft || {};
  const isDua = draft.kind === "dua";
  const labels = isDua ? { ...localizedCopy(lang), ...(DUA_COPY[lang] || DUA_COPY.fr) } : localizedCopy(lang);
  const surahNumber = isDua
    ? Number(draft.surah) || 0
    : Number(draft.surah) || Number(currentSurah) || 1;
  const ayahNumber = isDua
    ? Number(draft.ayah) || 0
    : Number(draft.ayah) || Number(currentAyah) || 1;
  // The card prints the number the reader displays; the text deep link keeps
  // the storage coordinate the routes and bookmarks are keyed on.
  const displayAyahNumber = Number(draft.displayAyah) || ayahNumber;
  const draftRiwaya = (draft.riwaya || state.riwaya) === "warsh" ? "warsh" : "hafs";
  const surahData = surahNumber ? getSurah(surahNumber) : null;
  const initialPreset = isDua
    ? "doua"
    : theme === "dark"
      ? "madinah"
      : theme === "sepia"
        ? "mushaf"
        : "fajr";
  const [presetId, setPresetId] = useState(initialPreset);
  const [formatId, setFormatId] = useState("square");
  // A preset ships the frame and the motif it was drawn for. The reader's
  // explicit pick (null until made) wins and survives a later palette change.
  const [frameOverride, setFrameOverride] = useState(null);
  const [motifOverride, setMotifOverride] = useState(null);
  const [textScale, setTextScale] = useState("balanced");
  const [tab, setTab] = useState("models");
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [showRiwaya, setShowRiwaya] = useState(true);
  const [showBranding, setShowBranding] = useState(true);
  const [pngSize, setPngSize] = useState(0);
  const [busyAction, setBusyAction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [retryState, setRetryState] = useState("idle");

  const currentPreset =
    VERSE_CARD_PRESETS.find((item) => item.id === presetId) || VERSE_CARD_PRESETS[0];
  const frameId = frameOverride ?? currentPreset.geometry;
  const motifId = motifOverride ?? currentPreset.motif;

  const close = useCallback(() => {
    dispatch({ type: "SET", payload: { shareImageOpen: false, shareVerseDraft: null } });
  }, [dispatch]);

  // Data-layer text only. The card is never filled from the DOM again: a
  // scraped miss used to fall through to the Basmala under a valid reference.
  const arabicText = useMemo(() => cleanShareText(draft.arabicText), [draft.arabicText]);
  // The card's Quran face has no glyph for some canonical signs (U+06DF, U+06EB):
  // it would draw them as a large black dot. Same mapping as the reader's text.
  const cardArabicText = useMemo(
    () => applyFontSigns(arabicText, draftRiwaya === "warsh" ? "qpc-warsh" : "qpc-hafs"),
    [arabicText, draftRiwaya],
  );
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
  const sharePayload = useMemo(() => {
    if (isDua && !surahNumber) {
      // A Hisn al-Muslim dua has no verse coordinate: no deep link to claim.
      const reference = cleanShareText(draft.source || draft.occasion || "");
      const text = [
        arabicText,
        includeTranslation ? translationText : "",
        reference ? `— ${reference}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      return {
        title: `${cleanShareText(draft.occasion) || "Doua"} · MushafPlus`,
        text,
        url: DEFAULT_SHARE_ORIGIN,
        fullText: `${text}\n${DEFAULT_SHARE_ORIGIN}`,
      };
    }
    return createVerseSharePayload({
      surah: surahNumber,
      ayah: ayahNumber,
      arabicText,
      translationText: includeTranslation ? translationText : "",
      surahName: surahNameLabel,
      lang,
    });
  }, [arabicText, ayahNumber, draft.occasion, draft.source, includeTranslation, isDua, lang, surahNameLabel, surahNumber, translationText]);
  const arabicFontFamily = useMemo(
    () => resolveCardArabicFontFamily(draftRiwaya),
    [draftRiwaya],
  );
  const riwayaLabel = t(draftRiwaya === "warsh" ? "quran.warsh" : "quran.hafs", lang);
  const [cardFontCss, setCardFontCss] = useState("");
  const [surahNamesFontReady, setSurahNamesFontReady] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([loadCardFontCss(draftRiwaya), loadSurahNamesFontCss()]).then(
      ([arabicCss, ligatureCss]) => {
        if (!active) return;
        setCardFontCss(arabicCss + ligatureCss);
        setSurahNamesFontReady(Boolean(ligatureCss));
      },
    );
    return () => {
      active = false;
    };
  }, [draftRiwaya]);
  // Empty until the calligraphy is embedded: the card then keeps the Amiri
  // surah line instead of showing the ligature's raw "001" code points.
  const surahLigature = surahNamesFontReady ? getSurahLigature(surahNumber) : "";
  const svgContent = useMemo(
    () => (verseUnavailable ? "" : buildVerseCardSvg({
      arabicText: cardArabicText,
      translationText,
      includeTranslation,
      surahNameAr: surahData?.ar,
      surahNameLabel,
      surahLigature,
      surahNumber,
      ayahNumber: displayAyahNumber,
      presetId,
      formatId,
      arabicFontFamily,
      riwayaLabel: isDua ? "" : riwayaLabel,
      riwayaLabelRtl: lang === "ar",
      kind: isDua ? "dua" : "verse",
      sourceLabel: cleanShareText(draft.source || ""),
      occasionLabel: cleanShareText(draft.occasion || ""),
      frameId,
      motifId,
      textScale,
      showRiwaya,
      showBranding,
    })),
    [
      arabicFontFamily,
      cardArabicText,
      displayAyahNumber,
      draft.occasion,
      draft.source,
      formatId,
      frameId,
      includeTranslation,
      isDua,
      lang,
      motifId,
      presetId,
      riwayaLabel,
      showBranding,
      showRiwaya,
      surahData?.ar,
      surahNameLabel,
      surahLigature,
      surahNumber,
      textScale,
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
  const previewUrl = safeSvgContent ? svgDataUrl(safeSvgContent) : "";

  /*
   * Picker tiles are miniatures of the real card, drawn in the palette, frame
   * and motif each tile would give. Only the open tab is drawn, from our own
   * constants (no reader text), so nothing here needs the sanitiser.
   */
  const tileUrls = useMemo(() => {
    if (tab === "text") return {};
    // A tile shows the very verse being shared, laid out by the same code as the
    // card (portrait, so every tile has one shape). The embedded fonts are left
    // out: at this size the system Arabic face is enough, and a data URL per
    // tile would otherwise carry the font many times over.
    const miniature = (tilePreset, tileFrame, tileMotif) =>
      svgDataUrl(
        verseUnavailable
          ? buildVerseCardThumbSvg(tilePreset, tileFrame, tileMotif)
          : buildVerseCardSvg({
              arabicText: cardArabicText,
              translationText,
              includeTranslation,
              surahNameAr: surahData?.ar,
              surahNameLabel,
              surahNumber,
              ayahNumber: displayAyahNumber,
              presetId: tilePreset,
              formatId: "portrait",
              kind: isDua ? "dua" : "verse",
              sourceLabel: cleanShareText(draft.source || ""),
              occasionLabel: cleanShareText(draft.occasion || ""),
              frameId: tileFrame,
              motifId: tileMotif,
              textScale,
              showRiwaya: false,
              showBranding: false,
            }),
      );
    if (tab === "models") {
      return Object.fromEntries(
        VERSE_CARD_PRESETS.map((item) => [
          item.id,
          miniature(item.id, frameOverride ?? item.geometry, motifOverride ?? item.motif),
        ]),
      );
    }
    if (tab === "frame") {
      return Object.fromEntries(VERSE_CARD_FRAMES.map((item) => [item.id, miniature(presetId, item.id, motifId)]));
    }
    return Object.fromEntries(VERSE_CARD_MOTIFS.map((item) => [item.id, miniature(presetId, frameId, item.id)]));
  }, [
    cardArabicText,
    displayAyahNumber,
    draft.occasion,
    draft.source,
    frameId,
    frameOverride,
    includeTranslation,
    isDua,
    motifId,
    motifOverride,
    presetId,
    surahData?.ar,
    surahNameLabel,
    surahNumber,
    tab,
    textScale,
    translationText,
    verseUnavailable,
  ]);

  const filename = isDua && !surahNumber
    ? `mushafplus-doua-${formatId}.png`
    : `mushafplus-${surahNumber}-${displayAyahNumber}-${formatId}.png`;

  const createPng = useCallback(
    () => svgToPngBlob(safeSvgContent, format.width, format.height),
    [format.height, format.width, safeSvgContent],
  );

  /*
   * The studio states the real weight of what will be shared. The card is
   * rasterised once the reader stops changing options, which also warms the
   * canvas path the share, download and copy buttons then reuse.
   */
  useEffect(() => {
    if (!safeSvgContent) {
      setPngSize(0);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      svgToPngBlob(safeSvgContent, format.width, format.height)
        .then((blob) => {
          if (active) setPngSize(blob.size);
        })
        .catch(() => {});
    }, 450);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [format.height, format.width, safeSvgContent]);
  const cardWeightLabel = pngSize ? `≈ ${Math.round(pngSize / 1024)} kB` : "PNG";

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
    setPngSize(blob.size);
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
    const blob = await createPng();
    setPngSize(blob.size);
    downloadBlob(blob, filename);
    setFeedback(labels.downloaded);
  });

  const handleCopyImage = () => runAction("copy", async () => {
    const blob = await createPng();
    setPngSize(blob.size);
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      downloadBlob(blob, filename);
      setFeedback(labels.fallback);
      return;
    }
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setFeedback(labels.copied);
  });

  // Roving tabindex: arrows move between tabs, mirrored in right-to-left.
  const onTabKeyDown = (event) => {
    const index = STUDIO_TABS.findIndex((item) => item.id === tab);
    const forward = lang === "ar" ? "ArrowLeft" : "ArrowRight";
    const backward = lang === "ar" ? "ArrowRight" : "ArrowLeft";
    let next = -1;
    if (event.key === forward) next = (index + 1) % STUDIO_TABS.length;
    else if (event.key === backward) next = (index - 1 + STUDIO_TABS.length) % STUDIO_TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = STUDIO_TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const target = STUDIO_TABS[next].id;
    setTab(target);
    document.getElementById(`share-tab-${target}`)?.focus();
  };

  const renderTile = ({ id, name, active, onSelect, url }) => (
    <button key={id} type="button" className={`share-tile${active ? " is-active" : ""}`} onClick={onSelect} aria-pressed={active}>
      <span className="share-tile__thumb" aria-hidden="true">
        {url ? <img src={url} alt="" decoding="async" draggable="false" /> : null}
      </span>
      <span className="share-tile__name">{name}</span>
      {active ? <Check className="share-tile__check" size={13} aria-hidden="true" /> : null}
    </button>
  );

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
                <span className="share-studio__kicker">
                  <Share2 size={13} />{" "}
                  {isDua && !surahNumber
                    ? cleanShareText(draft.occasion) || cleanShareText(draft.source) || labels.title
                    : `${surahNameLabel} · ${surahNumber}:${displayAyahNumber}`}
                </span>
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
                {verseUnavailable ? null : (
                  <div className="share-studio__meta">
                    <span dir="ltr">{format.width} × {format.height} px</span>
                    <span dir="ltr">{cardWeightLabel}</span>
                  </div>
                )}

                <fieldset className="share-control-group share-control-group--format">
                  <legend>{labels.format}</legend>
                  <div className="share-format-picker">
                    {VERSE_CARD_FORMATS.map((item) => (
                      <button key={item.id} type="button" className={formatId === item.id ? "is-active" : ""} onClick={() => setFormatId(item.id)} aria-pressed={formatId === item.id}>
                        <span className={`share-format-icon share-format-icon--${item.id}`} aria-hidden="true" />
                        <strong>{labels.formats[item.id] || item.label}</strong>
                        <span className="share-format-ratio" dir="ltr">{item.ratio}</span>
                      </button>
                    ))}
                  </div>
                  <p className="share-format-hint">{t(`share.formatHints.${format.id}`, lang)}</p>
                </fieldset>
              </section>

              <section className="share-studio__controls" aria-label={labels.customize}>
                <div
                  className="share-tabs"
                  role="tablist"
                  aria-label={labels.customize}
                  onKeyDown={onTabKeyDown}
                >
                  {STUDIO_TABS.map(({ id, Icon }) => (
                    <button
                      key={id}
                      id={`share-tab-${id}`}
                      type="button"
                      role="tab"
                      aria-selected={tab === id}
                      aria-controls={`share-panel-${id}`}
                      tabIndex={tab === id ? 0 : -1}
                      className={tab === id ? "is-active" : ""}
                      onClick={() => setTab(id)}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{labels.tabs[id]}</span>
                    </button>
                  ))}
                </div>

                <div
                  key={tab}
                  id={`share-panel-${tab}`}
                  role="tabpanel"
                  aria-labelledby={`share-tab-${tab}`}
                  className="share-tabpanel"
                  tabIndex={0}
                >
                  {tab === "models" ? (
                    <div className="share-theme-groups" role="group" aria-label={labels.style}>
                      {[
                        ["light", VERSE_CARD_PRESETS.filter((item) => !isDarkPreset(item))],
                        ["dark", VERSE_CARD_PRESETS.filter((item) => isDarkPreset(item))],
                      ].map(([group, items]) => (
                        <div key={group} className="share-theme-group" role="group" aria-labelledby={`share-group-${group}`}>
                          <h3 id={`share-group-${group}`} className="share-theme-group__title">{labels.groups[group]}</h3>
                          <div className="share-theme-picker">
                            {items.map((item) => renderTile({
                              id: item.id,
                              name: labels.presets[item.id] || item.label,
                              active: presetId === item.id,
                              onSelect: () => setPresetId(item.id),
                              url: tileUrls[item.id],
                            }))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {tab === "frame" ? (
                    <div className="share-choice-picker" role="group" aria-label={labels.frame}>
                      {VERSE_CARD_FRAMES.map((item) => renderTile({
                        id: item.id,
                        name: labels.frames[item.id] || item.label,
                        active: frameId === item.id,
                        onSelect: () => setFrameOverride(item.id),
                        url: tileUrls[item.id],
                      }))}
                    </div>
                  ) : null}

                  {tab === "motif" ? (
                    <div className="share-choice-picker" role="group" aria-label={labels.motif}>
                      {VERSE_CARD_MOTIFS.map((item) => renderTile({
                        id: item.id,
                        name: labels.motifs[item.id] || item.label,
                        active: motifId === item.id,
                        onSelect: () => setMotifOverride(item.id),
                        url: tileUrls[item.id],
                      }))}
                    </div>
                  ) : null}

                  {tab === "text" ? (
                    <>
                      <fieldset className="share-control-group">
                        <legend>{labels.textSize}</legend>
                        <div className="share-scale-picker">
                          {VERSE_CARD_TEXT_SCALES.map((item) => (
                            <button key={item.id} type="button" className={textScale === item.id ? "is-active" : ""} onClick={() => setTextScale(item.id)} aria-pressed={textScale === item.id}>
                              <span className="share-scale-glyph" style={{ fontSize: item.glyph }} aria-hidden="true">A</span>
                              <span>{labels.scales[item.id] || item.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="share-control-group">
                        <legend>{labels.content}</legend>
                        <div className="share-studio__quick-setting share-studio__quick-setting--group">
                          <button
                            type="button"
                            className={`share-toggle ${includeTranslation ? "on" : "off"}`}
                            onClick={() => setIncludeTranslation((value) => !value)}
                            aria-pressed={includeTranslation}
                          >
                            <span aria-hidden="true" /> {labels.translation}
                          </button>
                          <button
                            type="button"
                            className={`share-toggle ${showRiwaya ? "on" : "off"}`}
                            onClick={() => setShowRiwaya((value) => !value)}
                            aria-pressed={showRiwaya}
                          >
                            <span aria-hidden="true" /> {labels.riwaya}
                          </button>
                          <button
                            type="button"
                            className={`share-toggle ${showBranding ? "on" : "off"}`}
                            onClick={() => setShowBranding((value) => !value)}
                            aria-pressed={showBranding}
                          >
                            <span aria-hidden="true" /> {labels.branding}
                          </button>
                        </div>
                      </fieldset>
                    </>
                  ) : null}
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
