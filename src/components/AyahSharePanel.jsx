import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getSurah, getSurahLigature } from "../data/surahs";
import { t } from "../i18n";
import { sanitizeSvgMarkup } from "../lib/security";
import { cleanShareText, createVerseSharePayload, DEFAULT_SHARE_ORIGIN } from "../services/verseShareService";

export const VERSE_CARD_FORMATS = [
  { id: "square", label: "Carré", detail: "Publication", width: 1080, height: 1080, ratio: "1:1", platforms: "Instagram · Facebook · X" },
  { id: "portrait", label: "Portrait", detail: "Fil social", width: 1080, height: 1350, ratio: "4:5", platforms: "Instagram · Facebook · Threads" },
  { id: "story", label: "Story", detail: "Plein écran", width: 1080, height: 1920, ratio: "9:16", platforms: "Instagram · WhatsApp · Snapchat" },
];

/*
 * A card is one palette plus three independent choices: the frame, the
 * background motif and the Quran-text scale. Every preset declares the frame
 * and the motif it was drawn for, and the studio keeps the reader's explicit
 * pick when they switch palette afterwards.
 */
export const VERSE_CARD_PRESETS = [
  {
    id: "fajr",
    label: "Lueur du Fajr",
    geometry: "classic",
    motif: "star",
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
    geometry: "classic",
    motif: "star",
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
    geometry: "classic",
    motif: "medallion",
    background: "#071a16",
    surface: "#0d2922",
    ink: "#f3eee2",
    arabic: "#74dfb5",
    accent: "#d4ad58",
    muted: "#a7bbb3",
  },
  {
    id: "ivoire",
    label: "Ivoire",
    geometry: "fine",
    motif: "none",
    background: "#faf7f0",
    surface: "#fffdf8",
    ink: "#33302a",
    arabic: "#4a4234",
    accent: "#c2a15c",
    muted: "#8d8577",
  },
  {
    id: "nuit-or",
    label: "Nuit & Or",
    geometry: "corners",
    motif: "medallion",
    background: "#0b0e1a",
    surface: "#161b30",
    ink: "#f4eeda",
    arabic: "#ecd9a2",
    accent: "#d4af37",
    muted: "#98a0b8",
  },
  {
    id: "doua",
    label: "Doua",
    geometry: "fine",
    motif: "none",
    background: "#f3efe4",
    surface: "#faf7ee",
    ink: "#2e3a33",
    arabic: "#1f5c40",
    accent: "#b98a2f",
    muted: "#6f7a70",
  },
  {
    id: "aube",
    label: "Aube rosée",
    geometry: "fine",
    motif: "none",
    background: "#f8eef1",
    surface: "#fdf8f9",
    ink: "#3a2b31",
    arabic: "#8e3054",
    accent: "#c58f9f",
    muted: "#8b737b",
  },
  {
    id: "encre",
    label: "Encre",
    geometry: "fine",
    motif: "none",
    background: "#f7f7f5",
    surface: "#fdfdfc",
    ink: "#1a1a1d",
    arabic: "#111114",
    accent: "#a9a9a4",
    muted: "#6e6e70",
  },
];

export const VERSE_CARD_FRAMES = [
  { id: "classic", label: "Classique" },
  { id: "fine", label: "Fin" },
  { id: "corners", label: "Coins dorés" },
  { id: "none", label: "Sans cadre" },
];

export const VERSE_CARD_MOTIFS = [
  { id: "none", label: "Aucun" },
  { id: "star", label: "Étoilé" },
  { id: "medallion", label: "Médaillon" },
];

export const VERSE_CARD_TEXT_SCALES = [
  { id: "compact", label: "Compact", ratio: 0.86, glyph: "0.68rem" },
  { id: "balanced", label: "Équilibré", ratio: 1, glyph: "0.84rem" },
  { id: "large", label: "Grand", ratio: 1.16, glyph: "1rem" },
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

/*
 * Frame and motif pickers draw what they promise instead of borrowing a generic
 * icon: a nested frame, a hairline, gilded corners, a bare dashed box, a star
 * lattice, a medallion. Inline shapes keep the lazy chunk small.
 */
const CARD_GLYPHS = {
  "frame-classic": (
    <>
      <rect x="1.5" y="1.5" width="21" height="15" rx="2.5" />
      <rect x="4.8" y="4.2" width="14.4" height="9.6" rx="1.5" opacity="0.45" />
    </>
  ),
  "frame-fine": <rect x="1.5" y="1.5" width="21" height="15" rx="2.5" />,
  "frame-corners": (
    <path d="M7.6 1.5H4A2.5 2.5 0 0 0 1.5 4v3.6M16.4 1.5H20A2.5 2.5 0 0 1 22.5 4v3.6M7.6 16.5H4A2.5 2.5 0 0 1 1.5 14v-3.6M16.4 16.5H20a2.5 2.5 0 0 0 2.5-2.5v-3.6" />
  ),
  "frame-none": (
    <rect x="1.5" y="1.5" width="21" height="15" rx="2.5" strokeDasharray="3 3" opacity="0.5" />
  ),
  "motif-none": <path d="M4 9h16" strokeDasharray="2 3" opacity="0.55" />,
  "motif-star": (
    <>
      <path d="M7 3.6 9 6l-2 2.4L5 6z" />
      <path d="M17 3.6 19 6l-2 2.4L15 6z" />
      <path d="M12 9.6 14 12l-2 2.4L10 12z" />
    </>
  ),
  "motif-medallion": (
    <>
      <circle cx="12" cy="9" r="6.4" />
      <circle cx="12" cy="9" r="2.6" />
    </>
  ),
};

function CardGlyph({ id }) {
  return (
    <svg
      className="share-choice-glyph"
      viewBox="0 0 24 18"
      width="20"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {CARD_GLYPHS[id] || null}
    </svg>
  );
}

function buildGeometry(width, height, preset, geometryId) {
  const geometry = geometryId || preset.geometry || "classic";
  if (geometry === "none") return "";
  const inset = Math.round(width * 0.043);
  const corner = Math.round(width * 0.09);
  const center = width / 2;

  if (geometry === "fine") {
    // Minimal palettes: one hairline gold frame with quiet corner ticks.
    const tick = Math.round(width * 0.05);
    return `
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="10" fill="none" stroke="${preset.accent}" stroke-width="1.6" opacity="0.85"/>
    <path d="M ${inset + tick} ${inset + 10} L ${inset + 10} ${inset + 10} L ${inset + 10} ${inset + tick}" fill="none" stroke="${preset.accent}" stroke-width="2.4" opacity="0.9"/>
    <path d="M ${width - inset - tick} ${inset + 10} L ${width - inset - 10} ${inset + 10} L ${width - inset - 10} ${inset + tick}" fill="none" stroke="${preset.accent}" stroke-width="2.4" opacity="0.9"/>
    <path d="M ${inset + 10} ${height - inset - tick} L ${inset + 10} ${height - inset - 10} L ${inset + tick} ${height - inset - 10}" fill="none" stroke="${preset.accent}" stroke-width="2.4" opacity="0.9"/>
    <path d="M ${width - inset - 10} ${height - inset - tick} L ${width - inset - 10} ${height - inset - 10} L ${width - inset - tick} ${height - inset - 10}" fill="none" stroke="${preset.accent}" stroke-width="2.4" opacity="0.9"/>
  `;
  }

  if (geometry === "corners") {
    // Gilded double frame with corner arabesques.
    const c = inset + 6;
    const span = Math.round(width * 0.14);
    const arc = (x, y, sx, sy) =>
      `M ${x} ${y + sy * span} Q ${x} ${y} ${x + sx * span} ${y}`;
    return `
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="26" fill="none" stroke="${preset.accent}" stroke-width="2.2" opacity="0.8"/>
    <rect x="${inset + 12}" y="${inset + 12}" width="${width - (inset + 12) * 2}" height="${height - (inset + 12) * 2}" rx="18" fill="none" stroke="${preset.accent}" stroke-width="1" opacity="0.3"/>
    <path d="${arc(c + 14, c + 14, 1, 1)}" fill="none" stroke="${preset.accent}" stroke-width="2.6" opacity="0.95"/>
    <path d="${arc(width - c - 14, c + 14, -1, 1)}" fill="none" stroke="${preset.accent}" stroke-width="2.6" opacity="0.95"/>
    <path d="${arc(c + 14, height - c - 14, 1, -1)}" fill="none" stroke="${preset.accent}" stroke-width="2.6" opacity="0.95"/>
    <path d="${arc(width - c - 14, height - c - 14, -1, -1)}" fill="none" stroke="${preset.accent}" stroke-width="2.6" opacity="0.95"/>
    <circle cx="${c + 26}" cy="${c + 26}" r="4" fill="${preset.accent}" opacity="0.9"/>
    <circle cx="${width - c - 26}" cy="${c + 26}" r="4" fill="${preset.accent}" opacity="0.9"/>
    <circle cx="${c + 26}" cy="${height - c - 26}" r="4" fill="${preset.accent}" opacity="0.9"/>
    <circle cx="${width - c - 26}" cy="${height - c - 26}" r="4" fill="${preset.accent}" opacity="0.9"/>
    <path d="M ${center - 60} ${inset + 40} Q ${center} ${inset + 16} ${center + 60} ${inset + 40}" fill="none" stroke="${preset.accent}" stroke-width="1.6" opacity="0.7"/>
    <circle cx="${center}" cy="${inset + 26}" r="5" fill="${preset.accent}" opacity="0.9"/>
  `;
  }

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

/**
 * Background motifs are drawn from primitives the SVG sanitiser keeps (no
 * <pattern>, no <mask>): a diamond lattice or a ringed medallion, both kept at
 * low opacity and away from the text blocks so Quran-text contrast is untouched.
 */
function buildBackgroundMotif(width, height, preset, motifId) {
  const motif = motifId || preset.motif || "none";
  if (motif === "none") return "";
  const inset = Math.round(width * 0.045);

  if (motif === "star") {
    const step = Math.round(width / 6);
    const radius = Math.round(step * 0.16);
    const nodes = [];
    for (let y = inset + step * 0.5; y < height - inset; y += step) {
      for (let x = inset + step * 0.5; x < width - inset; x += step) {
        nodes.push(
          `M ${x} ${y - radius} L ${x + radius} ${y} L ${x} ${y + radius} L ${x - radius} ${y} Z`,
          `M ${x - radius * 0.42} ${y} L ${x} ${y - radius * 0.42} L ${x + radius * 0.42} ${y} L ${x} ${y + radius * 0.42} Z`,
        );
      }
    }
    if (!nodes.length) return "";
    return `<g fill="none" stroke="${preset.accent}" stroke-width="1.3" opacity="0.15">${nodes
      .map((d) => `<path d="${d}"/>`)
      .join("")}</g>`;
  }

  // Medallion: two rings with radiating ticks behind the Arabic block.
  const cx = Math.round(width / 2);
  const cy = Math.round(height * 0.46);
  const outer = Math.round(width * 0.33);
  const rays = Array.from({ length: 16 }, (_, index) => {
    const angle = (index * Math.PI * 2) / 16;
    const inner = outer * 0.78;
    const x1 = cx + Math.cos(angle) * inner;
    const y1 = cy + Math.sin(angle) * inner;
    const x2 = cx + Math.cos(angle) * outer;
    const y2 = cy + Math.sin(angle) * outer;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join("");
  return `<g fill="none" stroke="${preset.accent}" stroke-width="1.6" opacity="0.14"><circle cx="${cx}" cy="${cy}" r="${outer}"/><circle cx="${cx}" cy="${cy}" r="${Math.round(outer * 0.62)}"/>${rays}</g>`;
}

/**
 * Mushaf-style rule: two hairlines broken by a centred lozenge. It carries the
 * header, the translation block and the signature instead of the plain lines the
 * card used to print.
 */
function buildOrnamentDivider({ width, y, preset, span = 0.32, opacity = 0.55, size = 6 }) {
  const center = width / 2;
  const half = Math.round(width * span * 0.5);
  const gap = size * 2 + 8;
  return `
    <g stroke="${preset.accent}" stroke-width="2" opacity="${opacity}">
      <line x1="${center - half}" y1="${y}" x2="${center - gap}" y2="${y}"/>
      <line x1="${center + gap}" y1="${y}" x2="${center + half}" y2="${y}"/>
    </g>
    <path d="M ${center} ${y - size} L ${center + size} ${y} L ${center} ${y + size} L ${center - size} ${y} Z" fill="${preset.accent}" opacity="${Math.min(0.95, opacity + 0.3)}"/>`;
}

function buildOccasionBadge({ width, preset, occasionLabel, top = 236 }) {
  if (!occasionLabel) return { markup: "", extraTop: 0 };
  const text = escapeSvgText(String(occasionLabel).slice(0, 40));
  const badgeWidth = Math.min(
    Math.round(width * 0.62),
    Math.max(220, text.length * 17 + 72),
  );
  const x = Math.round((width - badgeWidth) / 2);
  const y = top;
  return {
    markup: `
    <rect x="${x}" y="${y}" width="${badgeWidth}" height="46" rx="23" fill="${preset.accent}" opacity="0.14"/>
    <rect x="${x}" y="${y}" width="${badgeWidth}" height="46" rx="23" fill="none" stroke="${preset.accent}" stroke-width="1.4" opacity="0.75"/>
    <text x="${width / 2}" y="${y + 30}" text-anchor="middle" font-family="'Cairo','Segoe UI',sans-serif" font-size="22" letter-spacing="1.5" fill="${preset.accent}">${text}</text>`,
    extraTop: 70,
  };
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
      const response = await fetch(href);
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

function buildRiwayaLine({ width, preset, riwayaLabel, riwayaLabelRtl, y = 208 }) {
  if (!riwayaLabel) return "";
  const x = Math.round(width * 0.5);
  return `<text x="${x}" y="${y}" text-anchor="middle" direction="${riwayaLabelRtl ? "rtl" : "ltr"}" unicode-bidi="plaintext" font-family="'Cairo','Segoe UI',sans-serif" font-size="19" letter-spacing="${riwayaLabelRtl ? 0 : 1.5}" fill="${preset.muted}">${escapeSvgText(riwayaLabel)}</text>`;
}

export function buildVerseCardSvg({
  arabicText,
  translationText,
  includeTranslation,
  surahNameAr,
  surahNameLabel,
  surahLigature = "",
  surahNumber,
  ayahNumber,
  presetId = "fajr",
  formatId = "square",
  arabicFontFamily,
  riwayaLabel = "",
  riwayaLabelRtl = false,
  kind = "verse",
  sourceLabel = "",
  occasionLabel = "",
  frameId = "",
  motifId = "",
  textScale = "balanced",
  showRiwaya = true,
  showBranding = true,
}) {
  const preset = VERSE_CARD_PRESETS.find((item) => item.id === presetId) || VERSE_CARD_PRESETS[0];
  const format = VERSE_CARD_FORMATS.find((item) => item.id === formatId) || VERSE_CARD_FORMATS[0];
  const scale = VERSE_CARD_TEXT_SCALES.find((item) => item.id === textScale) || VERSE_CARD_TEXT_SCALES[1];
  const { width, height } = format;
  const arabicFamily = arabicFontFamily || resolveCardArabicFontFamily("hafs");
  const isStory = formatId === "story";
  const isSquare = formatId === "square";
  const isDua = kind === "dua";
  const arabicLines = wrapWords(arabicText, isStory ? 29 : 32, isSquare ? 6 : isStory ? 10 : 8);
  const translationLines = includeTranslation
    ? wrapWords(translationText, isStory ? 48 : 55, isSquare ? 4 : isStory ? 7 : 5)
    : [];
  // The rule under the header moves up when the riwaya line is hidden.
  const headerRuleY = showRiwaya ? 234 : 214;
  const badge = buildOccasionBadge({
    width,
    preset,
    occasionLabel,
    top: headerRuleY + 22,
  });
  const contentTop = headerRuleY + (isStory ? 58 : 32) + badge.extraTop;
  const contentBottom = height - (showBranding ? 132 : 96);
  const availableHeight = contentBottom - contentTop;
  const translationSize = isStory ? 30 : 26;
  const translationLineHeight = Math.round(translationSize * 1.52);
  const panelPadY = Math.round(translationSize * 0.95);
  const panelHeight = translationLines.length
    ? translationLines.length * translationLineHeight + panelPadY * 2
    : 0;
  const dividerGap = translationLines.length ? (isStory ? 88 : 74) : 0;
  const arabicSpace = availableHeight - panelHeight - dividerGap;
  let arabicSize = Math.round(
    Math.max(38, Math.min(84, (arabicSpace / Math.max(1, arabicLines.length * 1.55)) * scale.ratio)),
  );
  let arabicLineHeight = Math.round(arabicSize * 1.55);
  if (arabicLines.length * arabicLineHeight > arabicSpace) {
    // The chosen scale never pushes the Quran text into the translation panel.
    arabicSize = Math.round(arabicSpace / Math.max(1, arabicLines.length * 1.55));
    arabicLineHeight = Math.round(arabicSize * 1.55);
  }
  const textHeight = arabicLines.length * arabicLineHeight;
  const contentHeight = textHeight + dividerGap + panelHeight;
  const contentStart = contentTop + Math.max(0, Math.round((availableHeight - contentHeight) / 2));
  const arabicStart = contentStart + arabicSize;
  const arabicEnd = arabicStart + Math.max(0, arabicLines.length - 1) * arabicLineHeight;
  const panelTop = arabicEnd + dividerGap;
  const dividerY = panelTop - Math.round(dividerGap * 0.45);
  const translationStart = panelTop + panelPadY + translationSize;
  const footerRuleY = height - 118;
  const hasSurahRef = !isDua || Boolean(surahNumber);
  const refLabel = hasSurahRef
    ? `${surahNameLabel || `Sourate ${surahNumber}`} · ${surahNumber}:${ayahNumber}`
    : sourceLabel || "Hisn al-Muslim";
  const arabicLabel = isDua
    ? surahNameAr
      ? `دعاء من سورة ${surahNameAr}`
      : "دعاء"
    : surahNameAr
      ? `سورة ${surahNameAr}`
      : "آية من القرآن الكريم";
  // The calligraphic surah ligature takes the header exactly like the in-app
  // reader does. It is only drawn when the surahnames bytes are embedded in
  // this very SVG; otherwise the code points would show up as "001" digits.
  const headerLine =
    surahLigature && !isDua && surahNumber
      ? `<text x="${width / 2}" y="144" text-anchor="middle" font-family="'surahnames',serif" font-size="50" fill="${preset.arabic}">${escapeSvgText(surahLigature)}</text>`
      : `<text x="${width / 2}" y="128" text-anchor="middle" direction="rtl" font-family="'Amiri Quran','Amiri',serif" font-size="33" fill="${preset.arabic}">${escapeSvgText(arabicLabel)}</text>`;

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
  ${buildBackgroundMotif(width, height, preset, motifId)}
  ${buildGeometry(width, height, preset, frameId)}
  ${headerLine}
  <text x="${width / 2}" y="181" text-anchor="middle" font-family="'Cairo','Segoe UI',sans-serif" font-size="24" letter-spacing="3" fill="${preset.muted}">${escapeSvgText(refLabel.toUpperCase())}</text>
  ${showRiwaya ? buildRiwayaLine({ width, preset, riwayaLabel, riwayaLabelRtl, y: 208 }) : ""}
  ${buildOrnamentDivider({ width, y: headerRuleY, preset, span: 0.34, opacity: 0.5 })}
  ${badge.markup}
  ${lineText(arabicLines, {
    x: width / 2,
    startY: arabicStart,
    lineHeight: arabicLineHeight,
    fontSize: arabicSize,
    fill: preset.ink,
    family: arabicFamily,
    direction: "rtl",
  })}
  ${translationLines.length
    ? `<rect x="${width * 0.075}" y="${panelTop}" width="${width * 0.85}" height="${panelHeight}" rx="28" fill="${preset.surface}" opacity="0.72"/>${buildOrnamentDivider({ width, y: dividerY, preset, span: 0.2, opacity: 0.62, size: 5 })}`
    : ""}
  ${lineText(translationLines, {
    x: width / 2,
    startY: translationStart,
    lineHeight: translationLineHeight,
    fontSize: translationSize,
    fill: preset.muted,
    family: "'Cairo','Segoe UI',sans-serif",
    direction: "ltr",
  })}
  ${showBranding
    ? `${buildOrnamentDivider({ width, y: footerRuleY, preset, span: 0.16, opacity: 0.34, size: 4 })}<text x="${width / 2}" y="${height - 88}" text-anchor="middle" font-family="Georgia,serif" font-size="26" font-weight="700" letter-spacing="1" fill="${preset.arabic}">MushafPlus</text><text x="${width / 2}" y="${height - 56}" text-anchor="middle" font-family="'Cairo','Segoe UI',sans-serif" font-size="18" letter-spacing="2" fill="${preset.muted}">LE CORAN · SIMPLEMENT</text>`
    : ""}
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
      frame: "الإطار",
      motif: "النقش",
      textSize: "حجم النص",
      content: "المحتوى",
      translation: "الترجمة",
      riwaya: "الرواية",
      branding: "التوقيع",
      frames: { classic: "كلاسيكي", fine: "رفيع", corners: "زوايا مذهّبة", none: "بلا إطار" },
      motifs: { none: "بدون", star: "نجمي", medallion: "ميدالية" },
      scales: { compact: "مضغوط", balanced: "متوازن", large: "كبير" },
      formats: { square: "مربّع", portrait: "طولي", story: "ستوري" },
      presets: {
        fajr: "نور الفجر",
        mushaf: "الرقّ",
        madinah: "ليل المدينة",
        ivoire: "عاجي",
        "nuit-or": "ليل وذهب",
        doua: "دعاء",
        aube: "فجر وردي",
        encre: "حِبر",
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
      style: "Design",
      frame: "Frame",
      motif: "Pattern",
      textSize: "Arabic text",
      content: "Content",
      translation: "Translation",
      riwaya: "Riwaya",
      branding: "Signature",
      frames: { classic: "Classic", fine: "Fine", corners: "Gilded corners", none: "No frame" },
      motifs: { none: "None", star: "Starry", medallion: "Medallion" },
      scales: { compact: "Compact", balanced: "Balanced", large: "Large" },
      formats: { square: "Square", portrait: "Portrait", story: "Story" },
      presets: {
        fajr: "Fajr glow",
        mushaf: "Parchment",
        madinah: "Madinah night",
        ivoire: "Ivory",
        "nuit-or": "Night & gold",
        doua: "Dua",
        aube: "Rose dawn",
        encre: "Ink",
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
    style: "Design",
    frame: "Cadre",
    motif: "Motif",
    textSize: "Texte arabe",
    content: "Contenu",
    translation: "Traduction",
    riwaya: "Riwaya",
    branding: "Signature",
    frames: { classic: "Classique", fine: "Fin", corners: "Coins dorés", none: "Sans cadre" },
    motifs: { none: "Aucun", star: "Étoilé", medallion: "Médaillon" },
    scales: { compact: "Compact", balanced: "Équilibré", large: "Grand" },
    formats: { square: "Carré", portrait: "Portrait", story: "Story" },
    presets: {
      fajr: "Lueur du Fajr",
      mushaf: "Parchemin",
      madinah: "Nuit de Médine",
      ivoire: "Ivoire",
      "nuit-or": "Nuit & Or",
      doua: "Doua",
      aube: "Aube rosée",
      encre: "Encre",
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

export default function AyahSharePanel() {
  const { state, dispatch } = useApp();
  const { lang, currentSurah, currentAyah, theme, shareVerseDraft } = state;
  const labels = localizedCopy(lang);
  const draft = shareVerseDraft || {};
  const isDua = draft.kind === "dua";
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
  const initialPresetData =
    VERSE_CARD_PRESETS.find((item) => item.id === initialPreset) || VERSE_CARD_PRESETS[0];
  const [presetId, setPresetId] = useState(initialPreset);
  const [formatId, setFormatId] = useState("square");
  // A preset ships the frame and the motif it was drawn for. The reader's
  // explicit pick wins and survives a later palette change.
  const [frameId, setFrameId] = useState(initialPresetData.geometry);
  const [motifId, setMotifId] = useState(initialPresetData.motif);
  const [textScale, setTextScale] = useState("balanced");
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [showRiwaya, setShowRiwaya] = useState(true);
  const [showBranding, setShowBranding] = useState(true);
  const [pngSize, setPngSize] = useState(0);
  const [busyAction, setBusyAction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [retryState, setRetryState] = useState("idle");
  const frameTouched = useRef(false);
  const motifTouched = useRef(false);

  const selectPreset = (item) => {
    setPresetId(item.id);
    if (!frameTouched.current) setFrameId(item.geometry);
    if (!motifTouched.current) setMotifId(item.motif);
  };

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
      arabicText,
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
      arabicText,
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
  const previewUrl = safeSvgContent
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(safeSvgContent)}`
    : "";
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
              </section>

              <section className="share-studio__controls">
                <fieldset className="share-control-group">
                  <legend>{labels.format}</legend>
                  <div className="share-format-picker">
                    {VERSE_CARD_FORMATS.map((item) => (
                      <button key={item.id} type="button" className={formatId === item.id ? "is-active" : ""} onClick={() => setFormatId(item.id)} aria-pressed={formatId === item.id}>
                        <span className={`share-format-icon share-format-icon--${item.id}`} aria-hidden="true" />
                        <span className="share-format-picker__head">
                          <strong>{labels.formats[item.id] || item.label}</strong>
                          <span className="share-format-ratio" dir="ltr">{item.ratio}</span>
                        </span>
                        <em dir="ltr">{item.width} × {item.height}</em>
                        <span className="share-format-platforms">{item.platforms}</span>
                      </button>
                    ))}
                  </div>
                  <p className="share-format-hint">{t(`share.formatHints.${format.id}`, lang)}</p>
                </fieldset>

                <fieldset className="share-control-group">
                  <legend>{labels.style}</legend>
                  <div className="share-theme-picker">
                    {VERSE_CARD_PRESETS.map((item) => (
                      <button key={item.id} type="button" className={presetId === item.id ? "is-active" : ""} onClick={() => selectPreset(item)} aria-pressed={presetId === item.id}>
                        <span
                          className="share-theme-card"
                          style={{
                            "--share-card-bg": item.background,
                            "--share-card-text": item.arabic,
                            "--share-card-accent": item.accent,
                            "--share-card-muted": item.muted,
                          }}
                          aria-hidden="true"
                        >
                          <span className="share-theme-card__frame" />
                          <span className="share-theme-card__line" />
                          <span className="share-theme-card__line share-theme-card__line--short" />
                        </span>
                        <span className="share-theme-card__name">{labels.presets[item.id] || item.label}</span>
                        {presetId === item.id ? <Check size={13} aria-hidden="true" /> : null}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="share-control-group">
                  <legend>{labels.frame}</legend>
                  <div className="share-choice-picker">
                    {VERSE_CARD_FRAMES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={frameId === item.id ? "is-active" : ""}
                        onClick={() => {
                          frameTouched.current = true;
                          setFrameId(item.id);
                        }}
                        aria-pressed={frameId === item.id}
                      >
                        <CardGlyph id={`frame-${item.id}`} />
                        <span>{labels.frames[item.id] || item.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="share-control-group">
                  <legend>{labels.motif}</legend>
                  <div className="share-choice-picker">
                    {VERSE_CARD_MOTIFS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={motifId === item.id ? "is-active" : ""}
                        onClick={() => {
                          motifTouched.current = true;
                          setMotifId(item.id);
                        }}
                        aria-pressed={motifId === item.id}
                      >
                        <CardGlyph id={`motif-${item.id}`} />
                        <span>{labels.motifs[item.id] || item.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="share-control-group">
                  <legend>{labels.textSize}</legend>
                  <div className="share-choice-picker">
                    {VERSE_CARD_TEXT_SCALES.map((item) => (
                      <button key={item.id} type="button" className={textScale === item.id ? "is-active" : ""} onClick={() => setTextScale(item.id)} aria-pressed={textScale === item.id}>
                        <span className="share-scale-glyph" style={{ fontSize: item.glyph }} aria-hidden="true">A</span>
                        <span>{labels.scales[item.id] || item.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="share-control-group">
                  <legend><Languages size={13} aria-hidden="true" /> {labels.content}</legend>
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
