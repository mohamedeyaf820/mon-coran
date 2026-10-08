/**
 * The verse card: palettes, frames, background motifs and the SVG it is drawn
 * as. Pure functions of their arguments (no window, no font loading), so the
 * studio panel, the picker tiles and the tests all draw the very same card.
 */

import { buildExtraGeometry, buildExtraMotif, starPoints } from "./cardOrnaments.js";

// Used only when a caller does not pass the riwaya's own stack.
const DEFAULT_ARABIC_FONT_STACK = "'QPC Hafs','Amiri Quran','Amiri',serif";

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
 *
 * The palettes stay inside MushafPlus's own family: emerald, gold and
 * parchment, plus a few calm companions (lapis, terracotta, sage, rose). The
 * Quran text keeps a contrast of 7:1 or more on its background and the
 * translation 4.5:1 on its panel (tests/verse-sharing.test.mjs).
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
    muted: "#586960",
  },
  {
    id: "emeraude",
    label: "Émeraude",
    geometry: "arch",
    motif: "star",
    background: "#052e22",
    surface: "#0b4533",
    ink: "#f6f0dc",
    arabic: "#ecd592",
    accent: "#d9b45a",
    muted: "#a9c4b7",
  },
  {
    id: "mushaf",
    label: "Parchemin",
    geometry: "frieze",
    motif: "lattice",
    background: "#efe3cb",
    surface: "#f8eedb",
    ink: "#493522",
    arabic: "#6b451f",
    accent: "#a36d25",
    muted: "#715e46",
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
    muted: "#6e6659",
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
    id: "sauge",
    label: "Sauge",
    geometry: "arch",
    motif: "dunes",
    background: "#e8eee3",
    surface: "#f4f8f0",
    ink: "#22372b",
    arabic: "#2f5f45",
    accent: "#a38a42",
    muted: "#56685d",
  },
  {
    id: "azur",
    label: "Azur d’Iznik",
    geometry: "frieze",
    motif: "lattice",
    background: "#0a2236",
    surface: "#10375a",
    ink: "#eef4f7",
    arabic: "#c4e8f0",
    accent: "#d8b867",
    muted: "#9db6c6",
  },
  {
    id: "aube",
    label: "Aube rosée",
    geometry: "fine",
    motif: "dunes",
    background: "#f8eef1",
    surface: "#fdf8f9",
    ink: "#3a2b31",
    arabic: "#8e3054",
    accent: "#c58f9f",
    muted: "#725c65",
  },
  {
    id: "cordoue",
    label: "Cordoue",
    geometry: "corners",
    motif: "dunes",
    background: "#2b1711",
    surface: "#3f2419",
    ink: "#f8eadb",
    arabic: "#f2cc8f",
    accent: "#d29553",
    muted: "#c0a28f",
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
    muted: "#59655b",
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
    muted: "#626264",
  },
  {
    id: "kiswa",
    label: "Kiswa",
    geometry: "zellige",
    motif: "arabesque",
    background: "#0a0a0a",
    surface: "#17140e",
    ink: "#f6edd0",
    arabic: "#e9cb73",
    accent: "#c9a24a",
    muted: "#bdb18f",
    foil: ["#fff1bd", "#f0d37c", "#d9ae4b"],
  },
  {
    id: "crepuscule",
    label: "Crépuscule",
    geometry: "ogee",
    motif: "night",
    background: "#1b1838",
    surface: "#2a2552",
    ink: "#f7efe9",
    arabic: "#ffd7a3",
    accent: "#eaa97d",
    muted: "#c6c0e2",
    sky: ["#3a2a78", "#241c4d", "#15122e"],
  },
  {
    id: "desert",
    label: "Désert",
    geometry: "ribbon",
    motif: "skyline",
    background: "#efdcbd",
    surface: "#f8ecd6",
    ink: "#3b2714",
    arabic: "#7e4219",
    accent: "#b5742c",
    muted: "#664f33",
  },
  {
    id: "menthe",
    label: "Menthe",
    geometry: "zellige",
    motif: "flowers",
    background: "#e1f0e8",
    surface: "#f1f9f5",
    ink: "#10352a",
    arabic: "#0d6149",
    accent: "#b99a3f",
    muted: "#46675a",
  },
  {
    id: "lapis",
    label: "Lapis",
    geometry: "scrolls",
    motif: "flowers",
    background: "#0b1d47",
    surface: "#142f66",
    ink: "#eff2fa",
    arabic: "#f5db98",
    accent: "#e0c06b",
    muted: "#aebcde",
    foil: ["#fff0c0", "#f5db98", "#e2bd68"],
  },
  {
    id: "aurore",
    label: "Aurore",
    geometry: "scrolls",
    motif: "arabesque",
    background: "#fbe7dc",
    surface: "#fff4ec",
    ink: "#3d2823",
    arabic: "#962f22",
    accent: "#cf8660",
    muted: "#74534b",
  },
];

/** Dark palettes read as night cards: the picker groups them apart from the light ones. */
export function isDarkPreset(preset) {
  const [r, g, b] = [1, 3, 5]
    .map((index) => parseInt(preset.background.slice(index, index + 2), 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.2;
}

export const VERSE_CARD_FRAMES = [
  { id: "classic", label: "Classique" },
  { id: "fine", label: "Fin" },
  { id: "corners", label: "Coins dorés" },
  { id: "frieze", label: "Frise" },
  { id: "arch", label: "Mihrab" },
  { id: "ogee", label: "Ogive" },
  { id: "zellige", label: "Zellige" },
  { id: "ribbon", label: "Plaque" },
  { id: "scrolls", label: "Enroulements" },
  { id: "none", label: "Sans cadre" },
];

export const VERSE_CARD_MOTIFS = [
  { id: "none", label: "Aucun" },
  { id: "star", label: "Étoiles" },
  { id: "lattice", label: "Treillis" },
  { id: "medallion", label: "Rosace" },
  { id: "dunes", label: "Dunes" },
  { id: "flowers", label: "Fleurs" },
  { id: "arabesque", label: "Arabesques" },
  { id: "skyline", label: "Mosquée" },
  { id: "night", label: "Nuit étoilée" },
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

// Vowel marks and joiners take no width of their own: only letters count when
// deciding whether a line of Arabic fits the card.
const ARABIC_MARKS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u2060]/gu;
// Loose upper bound of the advance of one letter with its marks, in em, for the Quran faces.
const ARABIC_LETTER_EM = 0.52;
const ARABIC_MIN_SIZE = 26;

function arabicLetterCount(line) {
  return line.replace(ARABIC_MARKS, "").replace(/\s+/gu, "").length;
}

/**
 * Arabic is never cut with an ellipsis while it can still be read: a long
 * invocation widens its lines and shrinks its size to the card instead.
 */
function layoutArabic(text, { baseWrap, space, ratio, maxWidth }) {
  const sizeFor = (count) => {
    const fit = space / Math.max(1, count * 1.55);
    return Math.round(Math.min(Math.max(38, Math.min(112, fit * ratio)), fit));
  };
  let best = null;
  for (let wrap = baseWrap; wrap <= Math.round(baseWrap * 2.6); wrap += 2) {
    const lines = wrapWords(text, wrap, Infinity);
    const size = sizeFor(lines.length);
    const widest = Math.max(...lines.map(arabicLetterCount), 0);
    if (widest * size * ARABIC_LETTER_EM > maxWidth && best) continue;
    if (!best || size > best.size) best = { lines, size };
    if (lines.length === 1) break;
  }
  if (best.size >= ARABIC_MIN_SIZE) return best;
  const keep = Math.max(1, Math.floor(space / (ARABIC_MIN_SIZE * 1.55)));
  return { lines: wrapWords(text, Math.round(baseWrap * 2.6), keep), size: ARABIC_MIN_SIZE };
}

/** The translation shrinks a little before it is shortened. */
function layoutTranslation(text, { baseChars, baseSize, baseMaxLines }) {
  const steps = [0, 3, 5, 7];
  for (const [index, drop] of steps.entries()) {
    const size = baseSize - drop;
    const lines = wrapWords(text, Math.round((baseChars * baseSize) / size), Infinity);
    if (lines.length <= baseMaxLines + index) return { lines, size };
  }
  const size = baseSize - steps[steps.length - 1];
  return {
    lines: wrapWords(text, Math.round((baseChars * baseSize) / size), baseMaxLines + steps.length - 1),
    size,
  };
}

function lineText(lines, { x, startY, lineHeight, fontSize, fill, family, direction }) {
  return lines
    .map(
      (line, index) => `<text x="${x}" y="${startY + index * lineHeight}" text-anchor="middle" direction="${direction}" unicode-bidi="plaintext" font-family="${family}" font-size="${fontSize}" fill="${fill}">${escapeSvgText(line)}</text>`,
    )
    .join("");
}

const round1 = (value) => Math.round(value * 10) / 10;

/**
 * Mihrab niche: a pointed arch whose springline sits half a width below the
 * apex, drawn as two arcs that meet on the axis. `d` insets the outline so the
 * same helper gives the outer line, the inner hairline and the filled niche.
 */
function archPath(width, height, d = 0) {
  const inset = Math.round(width * 0.043);
  const x0 = inset;
  const x1 = width - inset;
  const span = x1 - x0;
  const radius = span * 0.55;
  const springline = inset + Math.sqrt(span * radius - (span * span) / 4);
  const bottom = height - inset;
  const innerRadius = radius - d;
  const apexY =
    springline - Math.sqrt(Math.max(0, innerRadius * innerRadius - (radius - span / 2) ** 2));
  const left = x0 + d;
  const right = x1 - d;
  return {
    apexY: round1(apexY),
    springline: round1(springline),
    d: `M ${left} ${bottom - d} V ${round1(springline)} A ${round1(innerRadius)} ${round1(innerRadius)} 0 0 1 ${width / 2} ${round1(apexY)} A ${round1(innerRadius)} ${round1(innerRadius)} 0 0 1 ${right} ${round1(springline)} V ${bottom - d} Z`,
  };
}

/**
 * Frames. Each one is drawn from stroke primitives only (the SVG sanitiser
 * keeps path, rect, circle and line) and stays clear of the text column.
 */
function buildGeometry(width, height, preset, geometryId) {
  const geometry = geometryId || preset.geometry || "classic";
  if (geometry === "none") return "";
  const inset = Math.round(width * 0.043);
  const corner = Math.round(width * 0.09);
  const center = width / 2;
  const accent = preset.accent;

  const extra = buildExtraGeometry(width, height, preset, geometry);
  if (extra) return extra;

  if (geometry === "fine") {
    // Minimal palettes: one hairline gold frame with quiet corner ticks.
    const tick = Math.round(width * 0.05);
    return `
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="10" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.85"/>
    <path d="M ${inset + tick} ${inset + 10} L ${inset + 10} ${inset + 10} L ${inset + 10} ${inset + tick}" fill="none" stroke="${accent}" stroke-width="2.4" opacity="0.9"/>
    <path d="M ${width - inset - tick} ${inset + 10} L ${width - inset - 10} ${inset + 10} L ${width - inset - 10} ${inset + tick}" fill="none" stroke="${accent}" stroke-width="2.4" opacity="0.9"/>
    <path d="M ${inset + 10} ${height - inset - tick} L ${inset + 10} ${height - inset - 10} L ${inset + tick} ${height - inset - 10}" fill="none" stroke="${accent}" stroke-width="2.4" opacity="0.9"/>
    <path d="M ${width - inset - 10} ${height - inset - tick} L ${width - inset - 10} ${height - inset - 10} L ${width - inset - tick} ${height - inset - 10}" fill="none" stroke="${accent}" stroke-width="2.4" opacity="0.9"/>
  `;
  }

  if (geometry === "corners") {
    // Gilded double frame with corner arabesques.
    const c = inset + 6;
    const span = Math.round(width * 0.14);
    const arc = (x, y, sx, sy) =>
      `M ${x} ${y + sy * span} Q ${x} ${y} ${x + sx * span} ${y}`;
    return `
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="26" fill="none" stroke="${accent}" stroke-width="2.2" opacity="0.8"/>
    <rect x="${inset + 12}" y="${inset + 12}" width="${width - (inset + 12) * 2}" height="${height - (inset + 12) * 2}" rx="18" fill="none" stroke="${accent}" stroke-width="1" opacity="0.3"/>
    <path d="${arc(c + 14, c + 14, 1, 1)}" fill="none" stroke="${accent}" stroke-width="2.6" opacity="0.95"/>
    <path d="${arc(width - c - 14, c + 14, -1, 1)}" fill="none" stroke="${accent}" stroke-width="2.6" opacity="0.95"/>
    <path d="${arc(c + 14, height - c - 14, 1, -1)}" fill="none" stroke="${accent}" stroke-width="2.6" opacity="0.95"/>
    <path d="${arc(width - c - 14, height - c - 14, -1, -1)}" fill="none" stroke="${accent}" stroke-width="2.6" opacity="0.95"/>
    <circle cx="${c + 26}" cy="${c + 26}" r="4" fill="${accent}" opacity="0.9"/>
    <circle cx="${width - c - 26}" cy="${c + 26}" r="4" fill="${accent}" opacity="0.9"/>
    <circle cx="${c + 26}" cy="${height - c - 26}" r="4" fill="${accent}" opacity="0.9"/>
    <circle cx="${width - c - 26}" cy="${height - c - 26}" r="4" fill="${accent}" opacity="0.9"/>
    <path d="M ${center - 60} ${inset + 40} Q ${center} ${inset + 16} ${center + 60} ${inset + 40}" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.7"/>
    <circle cx="${center}" cy="${inset + 26}" r="5" fill="${accent}" opacity="0.9"/>
  `;
  }

  if (geometry === "frieze") {
    // Manuscript border: two rules with a running band of lozenges between.
    const band = 30;
    const mid = inset + band / 2;
    const size = 6;
    const lozenge = (x, y) =>
      `M ${round1(x)} ${round1(y - size)} l ${size} ${size} l ${-size} ${size} l ${-size} ${-size} z`;
    const stepX = (width - inset * 2 - band * 2) / Math.round((width - inset * 2 - band * 2) / 42);
    const stepY = (height - inset * 2 - band * 2) / Math.round((height - inset * 2 - band * 2) / 42);
    const marks = [];
    for (let x = inset + band; x <= width - inset - band + 0.5; x += stepX) {
      marks.push(lozenge(x, mid), lozenge(x, height - mid));
    }
    for (let y = inset + band + stepY; y <= height - inset - band - stepY + 0.5; y += stepY) {
      marks.push(lozenge(mid, y), lozenge(width - mid, y));
    }
    const knot = (x, y) =>
      `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${accent}" stroke-width="2" opacity="0.85"/><circle cx="${x}" cy="${y}" r="2.6" fill="${accent}" opacity="0.9"/>`;
    return `
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="12" fill="none" stroke="${accent}" stroke-width="2.4" opacity="0.85"/>
    <rect x="${inset + band}" y="${inset + band}" width="${width - (inset + band) * 2}" height="${height - (inset + band) * 2}" rx="6" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.6"/>
    <path d="${marks.join(" ")}" fill="${accent}" opacity="0.5"/>
    ${knot(mid, mid)}${knot(width - mid, mid)}${knot(mid, height - mid)}${knot(width - mid, height - mid)}
  `;
  }

  if (geometry === "arch") {
    // Mihrab: the header sits in the niche, spandrels keep the background motif.
    const outer = archPath(width, height, 0);
    const inner = archPath(width, height, 18);
    const cx = width / 2;
    return `
    <path d="${outer.d}" fill="${preset.surface}" fill-opacity="0.6" stroke="${accent}" stroke-width="2.6" stroke-opacity="0.9"/>
    <path d="${inner.d}" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.4"/>
    <path d="M ${cx} ${round1(outer.apexY - 18)} l 10 10 l -10 10 l -10 -10 z" fill="${accent}" opacity="0.9"/>
    <circle cx="${inset + 9}" cy="${outer.springline}" r="5" fill="${accent}" opacity="0.8"/>
    <circle cx="${width - inset - 9}" cy="${outer.springline}" r="5" fill="${accent}" opacity="0.8"/>
  `;
  }

  const diamonds = Array.from({ length: 9 }, (_, index) => {
    const x = width * 0.12 + index * width * 0.095;
    return `<path d="M ${x} ${height - inset} l 7 -7 l 7 7 l -7 7 z" fill="${accent}" opacity="0.34"/>`;
  }).join("");

  return `
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="34" fill="none" stroke="${accent}" stroke-width="2" opacity="0.72"/>
    <rect x="${inset + 14}" y="${inset + 14}" width="${width - (inset + 14) * 2}" height="${height - (inset + 14) * 2}" rx="26" fill="none" stroke="${accent}" stroke-width="1" opacity="0.24"/>
    <path d="M ${center - corner} ${inset + 44} Q ${center} ${inset - 8} ${center + corner} ${inset + 44}" fill="none" stroke="${accent}" stroke-width="2" opacity="0.58"/>
    <path d="M ${inset} ${inset + corner} L ${inset + corner} ${inset} M ${width - inset} ${inset + corner} L ${width - inset - corner} ${inset}" fill="none" stroke="${accent}" stroke-width="2" opacity="0.46"/>
    <circle cx="${center}" cy="${inset + 44}" r="8" fill="${accent}" opacity="0.78"/>
    ${diamonds}
  `;
}

/**
 * Background motifs are drawn from primitives the SVG sanitiser keeps (no
 * <pattern>, no <mask>, no <use>). Lattices are veiled toward the middle of the
 * card by a radial gradient, so the Quran text never sits on a busy ground.
 */
function buildBackgroundMotif(width, height, preset, motifId) {
  const motif = motifId || preset.motif || "none";
  if (motif === "none") return "";
  const accent = preset.accent;

  const extra = buildExtraMotif(width, height, preset, motif);
  if (extra) return extra;

  const veil = `<rect width="${width}" height="${height}" fill="url(#veil)"/>`;

  if (motif === "star") {
    // Khatam lattice: a field of eight-pointed stars (the rub el hizb shape).
    const step = Math.round(width / 5);
    const radius = Math.round(step * 0.3);
    const polygons = [];
    for (let row = 0; row * step * 0.62 < height + radius; row += 1) {
      const cy = row * step * 0.62;
      for (let col = 0; col * step < width + step; col += 1) {
        const cx = col * step + (row % 2 ? 0 : step / 2);
        const { axis, diagonal } = starPoints(cx, cy, radius);
        polygons.push(`<polygon points="${axis}"/><polygon points="${diagonal}"/>`);
      }
    }
    return `<g fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.17">${polygons.join("")}</g>${veil}`;
  }

  if (motif === "lattice") {
    // Mashrabiya: crossing diagonals, a calm woodwork grid.
    const spacing = Math.round(width / 9);
    const lines = [];
    for (let k = -Math.ceil(height / spacing); k <= Math.ceil(width / spacing); k += 1) {
      const x = k * spacing;
      lines.push(`M ${x} 0 L ${x + height} ${height}`, `M ${x + height} 0 L ${x} ${height}`);
    }
    return `<path d="${lines.join(" ")}" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.16"/>${veil}`;
  }

  if (motif === "dunes") {
    // Layered soft ridges rising from the foot of the card.
    const ridge = (base, rise, shift) =>
      `M 0 ${round1(base)} C ${round1(width * (0.22 + shift))} ${round1(base - rise)}, ${round1(width * (0.42 - shift))} ${round1(base + rise * 0.7)}, ${round1(width * 0.64)} ${round1(base - rise * 0.35)} S ${round1(width * 0.9)} ${round1(base - rise * 0.9)}, ${width} ${round1(base - rise * 0.2)} V ${height} H 0 Z`;
    return `
    <path d="${ridge(height * 0.78, 90, 0.04)}" fill="${accent}" opacity="0.06"/>
    <path d="${ridge(height * 0.85, 70, -0.03)}" fill="${accent}" opacity="0.08"/>
    <path d="${ridge(height * 0.92, 54, 0.02)}" fill="${accent}" opacity="0.1"/>
    <circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.12)}" r="${Math.round(width * 0.13)}" fill="${accent}" opacity="0.07"/>`;
  }

  // Medallion: rings, rays and a star behind the Arabic block.
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
  const { axis, diagonal } = starPoints(cx, cy, outer * 0.62);
  return `<g fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.14"><circle cx="${cx}" cy="${cy}" r="${outer}"/><circle cx="${cx}" cy="${cy}" r="${Math.round(outer * 0.62)}"/><polygon points="${axis}"/><polygon points="${diagonal}"/>${rays}</g>`;
}

/**
 * Mushaf-style rule: two hairlines broken by a centred lozenge. It carries the
 * header and the signature; the verse number gets the star badge below.
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

/** Arabic-Indic digits, as printed in a mushaf's verse medallions. */
function toArabicIndic(value) {
  return String(value).replace(/\d/g, (digit) => String.fromCharCode(0x0660 + Number(digit)));
}

/**
 * The verse number sits in an eight-pointed star between the Quran text and
 * the translation, flanked by two rules, like the end-of-verse medallion of a
 * printed mushaf.
 */
function buildVerseStar({ width, y, preset, number, span = 0.36, r = 29 }) {
  const center = width / 2;
  const half = Math.round(width * span * 0.5);
  const gap = r + 16;
  const { axis, diagonal } = starPoints(center, y, r);
  const label = number
    ? `<text x="${center}" y="${y + 9}" text-anchor="middle" font-family="'Amiri Quran','Amiri','Noto Naskh Arabic',serif" font-size="${number.length > 2 ? 21 : 26}" fill="${preset.arabic}">${toArabicIndic(number)}</text>`
    : `<circle cx="${center}" cy="${y}" r="4.5" fill="${preset.accent}" opacity="0.9"/>`;
  return `
    <g stroke="${preset.accent}" stroke-width="2" opacity="0.6">
      <line x1="${center - half}" y1="${y}" x2="${center - gap}" y2="${y}"/>
      <line x1="${center + gap}" y1="${y}" x2="${center + half}" y2="${y}"/>
    </g>
    <g fill="${preset.surface}" stroke="${preset.accent}" stroke-width="2.2">
      <polygon points="${axis}"/><polygon points="${diagonal}"/>
    </g>
    <circle cx="${center}" cy="${y}" r="${round1(r * 0.6)}" fill="none" stroke="${preset.accent}" stroke-width="1.2" opacity="0.55"/>
    ${label}`;
}

/** Paper, glow, motif and frame: the part of the card that has no text. */
function buildCardBackdrop(width, height, preset, frameId, motifId) {
  return `
  <defs>
    ${
      preset.sky
        ? `<linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${preset.sky[0]}"/>
      <stop offset="0.55" stop-color="${preset.sky[1]}"/>
      <stop offset="1" stop-color="${preset.sky[2]}"/>
    </linearGradient>`
        : `<linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${preset.background}"/>
      <stop offset="0.52" stop-color="${preset.surface}"/>
      <stop offset="1" stop-color="${preset.background}"/>
    </linearGradient>`
    }
    ${
      preset.foil
        ? `<linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${preset.foil[0]}"/>
      <stop offset="0.5" stop-color="${preset.foil[1]}"/>
      <stop offset="1" stop-color="${preset.foil[2]}"/>
    </linearGradient>`
        : ""
    }
    <radialGradient id="halo" cx="50%" cy="22%" r="68%">
      <stop offset="0" stop-color="${preset.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${preset.background}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="veil" cx="50%" cy="50%" r="62%">
      <stop offset="0.3" stop-color="${preset.background}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${preset.background}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#paper)"/>
  <rect width="${width}" height="${height}" fill="url(#halo)"/>
  ${buildBackgroundMotif(width, height, preset, motifId)}
  ${buildGeometry(width, height, preset, frameId)}`;
}

/**
 * A tile in the picker is a miniature of the real card in the same palette,
 * frame and motif: bars stand for the text, so no font has to be embedded.
 */
export function buildVerseCardThumbSvg(presetId, frameId, motifId) {
  const preset = VERSE_CARD_PRESETS.find((item) => item.id === presetId) || VERSE_CARD_PRESETS[0];
  const width = 1080;
  const height = 1350;
  const bar = (y, w, h, fill, opacity = 0.9) =>
    `<rect x="${(width - w) / 2}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="${opacity}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${buildCardBackdrop(width, height, preset, frameId, motifId)}
  ${bar(112, 190, 40, preset.arabic)}
  ${bar(178, 300, 18, preset.muted, 0.8)}
  ${buildOrnamentDivider({ width, y: 244, preset, span: 0.34, opacity: 0.5 })}
  ${bar(360, 760, 56, preset.ink)}
  ${bar(450, 820, 56, preset.ink)}
  ${bar(540, 700, 56, preset.ink)}
  ${bar(630, 440, 56, preset.ink)}
  ${buildVerseStar({ width, y: 790, preset, number: "", span: 0.36, r: 36 })}
  <rect x="${width * 0.075}" y="860" width="${width * 0.85}" height="230" rx="28" fill="${preset.surface}" opacity="0.72"/>
  ${bar(910, 640, 26, preset.muted, 0.75)}
  ${bar(962, 700, 26, preset.muted, 0.75)}
  ${bar(1014, 420, 26, preset.muted, 0.75)}
  ${bar(1180, 220, 30, preset.arabic, 0.9)}
</svg>`;
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
  const arabicFamily = arabicFontFamily || DEFAULT_ARABIC_FONT_STACK;
  const isStory = formatId === "story";
  const isSquare = formatId === "square";
  const isDua = kind === "dua";
  const frameKind = frameId || preset.geometry;
  // The niche narrows toward its apex and the frieze takes a band on every
  // side: the Quran column wraps a little earlier in both.
  const arabicWrap =
    (isStory ? 29 : 32) -
    (frameKind === "arch" || frameKind === "ogee" ? 3 : frameKind === "frieze" || frameKind === "ribbon" ? 2 : 0);
  // The frieze's lower band keeps the signature clear of its lozenges.
  const footerLift = frameKind === "frieze" ? 38 : 0;
  const panelInset = frameKind === "frieze" ? 0.115 : 0.075;
  const translationBaseSize = isStory ? 30 : 26;
  const translationFit = includeTranslation
    ? layoutTranslation(translationText, {
        baseChars: isStory ? 48 : 55,
        baseSize: translationBaseSize,
        baseMaxLines: isSquare ? 4 : isStory ? 7 : 5,
      })
    : { lines: [], size: translationBaseSize };
  const translationLines = translationFit.lines;
  // The rule under the header moves up when the riwaya line is hidden.
  const headerRuleY = showRiwaya ? 234 : 214;
  const badge = buildOccasionBadge({
    width,
    preset,
    occasionLabel,
    top: headerRuleY + 22,
  });
  const contentTop = headerRuleY + (isStory ? 58 : 32) + badge.extraTop;
  const contentBottom = height - (showBranding ? 132 : 96) - footerLift;
  const availableHeight = contentBottom - contentTop;
  const translationSize = translationFit.size;
  const translationLineHeight = Math.round(translationSize * 1.52);
  const panelPadY = Math.round(translationSize * 0.95);
  const panelHeight = translationLines.length
    ? translationLines.length * translationLineHeight + panelPadY * 2
    : 0;
  // A verse carries its number in a star; a Hisn al-Muslim dua has none.
  const hasVerseStar = !isDua && Boolean(ayahNumber);
  const dividerGap = translationLines.length
    ? (isStory ? 116 : 106)
    : hasVerseStar
      ? 96
      : 0;
  const arabicSpace = availableHeight - panelHeight - dividerGap;
  const arabicFit = layoutArabic(arabicText, {
    baseWrap: arabicWrap,
    space: arabicSpace,
    ratio: scale.ratio,
    maxWidth: width * (1 - panelInset * 2) * 0.92,
  });
  const arabicLines = arabicFit.lines;
  const arabicSize = arabicFit.size;
  const arabicLineHeight = Math.round(arabicSize * 1.55);
  const textHeight = arabicLines.length * arabicLineHeight;
  const contentHeight = textHeight + dividerGap + panelHeight;
  const contentStart = contentTop + Math.max(0, Math.round((availableHeight - contentHeight) / 2));
  const arabicStart = contentStart + arabicSize;
  const arabicEnd = arabicStart + Math.max(0, arabicLines.length - 1) * arabicLineHeight;
  const panelTop = arabicEnd + dividerGap;
  const dividerY = arabicEnd + Math.round(dividerGap * 0.56);
  const translationStart = panelTop + panelPadY + translationSize;
  const footerRuleY = height - 118 - footerLift;
  const hasSurahRef = !isDua || Boolean(surahNumber);
  const refLabel = hasSurahRef
    ? `${surahNameLabel || `Sourate ${surahNumber}`} · ${surahNumber}:${ayahNumber}`
    : sourceLabel || "Hisn al-Muslim";
  // A long source line shrinks to the card's width, then ends with an ellipsis, rather than running off both edges.
  const refUpper = refLabel.toUpperCase();
  const refSize = Math.max(15, Math.min(24, Math.floor((width * 0.84) / (Math.max(1, refUpper.length) * 0.8))));
  const refMaxChars = Math.floor((width * 0.84) / (refSize * 0.8));
  const refText = refUpper.length > refMaxChars ? `${refUpper.slice(0, refMaxChars - 1).trimEnd()}…` : refUpper;
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
  const divider = hasVerseStar
    ? buildVerseStar({ width, y: dividerY, preset, number: String(ayahNumber), span: 0.4 })
    : translationLines.length
      ? buildOrnamentDivider({ width, y: dividerY, preset, span: 0.2, opacity: 0.62, size: 5 })
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${buildCardBackdrop(width, height, preset, frameId, motifId)}
  ${headerLine}
  <text x="${width / 2}" y="181" text-anchor="middle" font-family="'Cairo','Segoe UI',sans-serif" font-size="${refSize}" letter-spacing="${round1(refSize / 8)}" fill="${preset.muted}">${escapeSvgText(refText)}</text>
  ${showRiwaya ? buildRiwayaLine({ width, preset, riwayaLabel, riwayaLabelRtl, y: 208 }) : ""}
  ${buildOrnamentDivider({ width, y: headerRuleY, preset, span: 0.34, opacity: 0.5 })}
  ${badge.markup}
  ${lineText(arabicLines, {
    x: width / 2,
    startY: arabicStart,
    lineHeight: arabicLineHeight,
    fontSize: arabicSize,
    fill: preset.foil ? "url(#foil)" : preset.ink,
    family: arabicFamily,
    direction: "rtl",
  })}
  ${translationLines.length
    ? `<rect x="${width * panelInset}" y="${panelTop}" width="${width * (1 - panelInset * 2)}" height="${panelHeight}" rx="28" fill="${preset.surface}" opacity="0.72"/>`
    : ""}
  ${divider}
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
    ? `${buildOrnamentDivider({ width, y: footerRuleY, preset, span: 0.16, opacity: 0.34, size: 4 })}<text x="${width / 2}" y="${height - 88 - footerLift}" text-anchor="middle" font-family="Georgia,serif" font-size="26" font-weight="700" letter-spacing="1" fill="${preset.arabic}">MushafPlus</text><text x="${width / 2}" y="${height - 56 - footerLift}" text-anchor="middle" font-family="'Cairo','Segoe UI',sans-serif" font-size="18" letter-spacing="2" fill="${preset.muted}">LE CORAN · SIMPLEMENT</text>`
    : ""}
</svg>`;
}
