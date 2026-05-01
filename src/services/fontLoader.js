const loadedFontIds = new Set();
const failedFontIds = new Set();
const inFlightLoads = new Map();

const FONT_SOURCES = {
  "qpc-hafs": {
    family: "QPC Hafs",
    url: "https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2",
    format: "woff2",
  },
  "qpc-indopak": {
    family: "QPC IndoPak",
    url: "https://verses.quran.foundation/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2",
    format: "woff2",
  },
  "amiri-quran": {
    family: "Amiri Quran",
    cssUrl:
      "https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap",
  },
  "scheherazade-new": {
    family: "Scheherazade New",
    cssUrl:
      "https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap",
  },
  "noto-naskh-arabic": {
    family: "Noto Naskh Arabic",
    cssUrl:
      "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap",
  },
  "qpc-nastaleeq": {
    family: "QPC Nastaleeq",
    url: "https://verses.quran.foundation/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2",
    format: "woff2",
  },
  "qpc-warsh": {
    family: "QPC Warsh",
    url: "https://fonts.quranwbw.com/v2/kfgqpc_uthman_taha_warsh-webfont.woff2",
    format: "woff2",
  },
};

const QCF_FONT_VERSIONS = new Set(["v1", "v2", "v4"]);
const QCF_FONT_BASE = "https://verses.quran.foundation/fonts/quran/hafs";

function normalizePage(page) {
  const value = Math.trunc(Number(page));
  if (!Number.isFinite(value)) return 1;
  return Math.min(604, Math.max(1, value));
}

function getQcfFontSource(version, page) {
  const normalizedVersion = QCF_FONT_VERSIONS.has(version) ? version : "v2";
  const normalizedPage = normalizePage(page);
  const folder = normalizedVersion === "v4" ? "v4/colrv1" : normalizedVersion;
  return {
    family: `qcf-${normalizedVersion}-p${normalizedPage}`,
    url: `${QCF_FONT_BASE}/${folder}/woff2/p${normalizedPage}.woff2`,
    format: "woff2",
    display: "block",
  };
}

function resolveFontSource(fontId, options = {}) {
  if (FONT_SOURCES[fontId]) return FONT_SOURCES[fontId];

  if (fontId === "qcf-v1") return getQcfFontSource("v1", options.page || 1);
  if (fontId === "qcf-v2") return getQcfFontSource("v2", options.page || 1);
  if (fontId === "qcf-v4-tajweed") return getQcfFontSource("v4", options.page || 1);

  const match = /^qcf-(v[124])-p(\d{1,3})$/.exec(String(fontId || ""));
  if (match) return getQcfFontSource(match[1], match[2]);

  return null;
}

async function loadFontFace(fontId, source) {
  if (typeof document === "undefined" || typeof FontFace === "undefined" || !source) {
    loadedFontIds.add(fontId);
    return { loaded: false, unsupported: true, family: source?.family || fontId };
  }

  if (source.cssUrl) {
    const linkId = `font-css-${fontId}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = source.cssUrl;
      document.head.appendChild(link);
      await new Promise((resolve) => {
        link.onload = resolve;
        link.onerror = resolve;
        setTimeout(resolve, 1800);
      });
    }
    try {
      await document.fonts.load(`400 1em "${source.family}"`);
    } catch {
      // Browser fallback stack still keeps the reader usable offline.
    }
    loadedFontIds.add(fontId);
    failedFontIds.delete(fontId);
    return { loaded: true, family: source.family, url: source.cssUrl };
  }

  try {
    if (document.fonts.check(`16px "${source.family}"`)) {
      loadedFontIds.add(fontId);
      failedFontIds.delete(fontId);
      return { loaded: true, cached: true, family: source.family };
    }
  } catch {
    // Continue with an explicit load.
  }

  const fontFace = new FontFace(
    source.family,
    `url("${source.url}") format("${source.format || "woff2"}")`,
    {
      style: "normal",
      weight: "400",
      display: source.display || "swap",
    },
  );

  const loadedFont = await fontFace.load();
  document.fonts.add(loadedFont);
  loadedFontIds.add(fontId);
  failedFontIds.delete(fontId);
  return { loaded: true, family: source.family, url: source.url };
}

export function getQcfPageFontFamily(page, version = "v2") {
  return getQcfFontSource(version, page).family;
}

export async function ensureFontLoaded(fontId, options = {}) {
  if (!fontId) return { loaded: false };

  const source = resolveFontSource(fontId, options);
  if (!source) {
    loadedFontIds.add(fontId);
    return { loaded: false, unknown: true, family: fontId };
  }

  const loadKey = `${source.family}:${source.url}`;
  if (loadedFontIds.has(loadKey) || loadedFontIds.has(fontId)) {
    return { loaded: true, cached: true, family: source.family };
  }

  if (inFlightLoads.has(loadKey)) return inFlightLoads.get(loadKey);

  const request = loadFontFace(loadKey, source)
    .then((result) => {
      if (result.loaded || result.cached) loadedFontIds.add(fontId);
      return result;
    })
    .catch((error) => {
      failedFontIds.add(fontId);
      return { loaded: false, family: source.family, url: source.url, error };
    })
    .finally(() => {
      inFlightLoads.delete(loadKey);
    });

  inFlightLoads.set(loadKey, request);
  return request;
}

export async function ensureQcfPageFontLoaded(page, version = "v2") {
  return ensureFontLoaded(`qcf-${version}-p${normalizePage(page)}`);
}

export async function warmQcfPageFonts(pages = [], version = "v2", { radius = 0 } = {}) {
  const targets = new Set();
  (Array.isArray(pages) ? pages : [pages]).forEach((page) => {
    const base = normalizePage(page);
    targets.add(base);
    for (let offset = 1; offset <= radius; offset += 1) {
      targets.add(normalizePage(base - offset));
      targets.add(normalizePage(base + offset));
    }
  });

  return Promise.all([...targets].map((page) => ensureQcfPageFontLoaded(page, version)));
}

export function isFontMarkedLoaded(fontId) {
  return loadedFontIds.has(fontId) || [...loadedFontIds].some((id) => id.startsWith(`${fontId}:`));
}

export function hasFontLoadFailed(fontId) {
  return failedFontIds.has(fontId);
}
