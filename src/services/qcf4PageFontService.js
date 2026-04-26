const MAX_MUSHAF_PAGE = 604;

const RIWAYA_QCF4_CONFIG = {
  hafs: {
    folder: "hafs",
    fontPrefix: "QCF4_Hafs",
    maxFontIndex: 47,
    fallbackFamily: "QCF4_Hafs_01_W",
  },
  warsh: {
    folder: "warsh",
    fontPrefix: "QCF4_Warsh",
    maxFontIndex: 50,
    fallbackFamily: "QCF4_Warsh_01_W",
  },
};

const inFlightLoads = new Map();
const loadedFamilies = new Set();
const failedFamilies = new Set();

function normalizeRiwaya(riwaya) {
  return riwaya === "warsh" ? "warsh" : "hafs";
}

function clampMushafPage(value) {
  const page = Math.trunc(Number(value));
  if (!Number.isFinite(page)) return 1;
  return Math.min(MAX_MUSHAF_PAGE, Math.max(1, page));
}

function clampFontIndex(value, maxIndex) {
  const page = Math.trunc(Number(value));
  if (!Number.isFinite(page)) return 1;
  return Math.min(maxIndex, Math.max(1, page));
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function getConfig(riwaya) {
  return RIWAYA_QCF4_CONFIG[normalizeRiwaya(riwaya)];
}

function getFontUrl(riwaya, fontIndex) {
  const cfg = getConfig(riwaya);
  const page2 = pad2(fontIndex);
  return `https://cdn.jsdelivr.net/gh/NaifAlsultan/typst-quran-package@main/fonts/${cfg.folder}/${cfg.fontPrefix}_${page2}_W.ttf`;
}

export function getQcf4FallbackFamily(riwaya) {
  return getConfig(riwaya).fallbackFamily;
}

export function mapMushafPageToQcf4Index(riwaya, mushafPage) {
  const cfg = getConfig(riwaya);
  const page = clampMushafPage(mushafPage);
  const mapped = Math.ceil((page / MAX_MUSHAF_PAGE) * cfg.maxFontIndex);
  return clampFontIndex(mapped, cfg.maxFontIndex);
}

export function getQcf4FamilyForMushafPage(riwaya, mushafPage) {
  const cfg = getConfig(riwaya);
  const index = mapMushafPageToQcf4Index(riwaya, mushafPage);
  return `${cfg.fontPrefix}_${pad2(index)}_W`;
}

export async function loadQcf4FontForMushafPage(riwaya, mushafPage) {
  const fontFamily = getQcf4FamilyForMushafPage(riwaya, mushafPage);
  const index = mapMushafPageToQcf4Index(riwaya, mushafPage);

  if (typeof document === "undefined" || typeof FontFace === "undefined") {
    return { family: fontFamily, index, loaded: false, unsupported: true };
  }

  if (loadedFamilies.has(fontFamily)) {
    return { family: fontFamily, index, loaded: true, cached: true };
  }

  try {
    if (document.fonts.check(`16px \"${fontFamily}\"`)) {
      loadedFamilies.add(fontFamily);
      failedFamilies.delete(fontFamily);
      return { family: fontFamily, index, loaded: true, cached: true };
    }
  } catch {
    // Ignore font check failures and continue with regular load flow.
  }

  if (inFlightLoads.has(fontFamily)) {
    return inFlightLoads.get(fontFamily);
  }

  const fontUrl = getFontUrl(riwaya, index);
  const loadPromise = (async () => {
    try {
      const font = new FontFace(fontFamily, `url(${fontUrl})`, {
        style: "normal",
        weight: "400",
        display: "swap",
      });
      const loadedFont = await font.load();
      document.fonts.add(loadedFont);
      loadedFamilies.add(fontFamily);
      failedFamilies.delete(fontFamily);
      return { family: fontFamily, index, loaded: true, url: fontUrl };
    } catch (error) {
      failedFamilies.add(fontFamily);
      return {
        family: fontFamily,
        index,
        loaded: false,
        url: fontUrl,
        error,
      };
    } finally {
      inFlightLoads.delete(fontFamily);
    }
  })();

  inFlightLoads.set(fontFamily, loadPromise);
  return loadPromise;
}

function buildWarmPages(pages, radius) {
  const around = new Set();
  pages.forEach((page) => {
    const base = clampMushafPage(page);
    around.add(base);
    for (let offset = 1; offset <= radius; offset += 1) {
      around.add(clampMushafPage(base - offset));
      around.add(clampMushafPage(base + offset));
    }
  });
  return [...around];
}

export async function warmQcf4FontsForPages(
  riwaya,
  pages,
  { radius = 1 } = {},
) {
  const normalizedPages = (Array.isArray(pages) ? pages : [])
    .map((page) => clampMushafPage(page))
    .filter((value, index, array) => array.indexOf(value) === index);

  const primaryPage = normalizedPages[0] ?? 1;
  const pagesToWarm = buildWarmPages(normalizedPages.length ? normalizedPages : [primaryPage], Math.max(0, Number(radius) || 0));

  const results = await Promise.all(
    pagesToWarm.map((page) => loadQcf4FontForMushafPage(riwaya, page)),
  );

  const primaryFamily = getQcf4FamilyForMushafPage(riwaya, primaryPage);
  const primaryLoaded = results.some(
    (result) => result.family === primaryFamily && result.loaded,
  );

  return {
    primaryPage,
    primaryFamily: primaryLoaded ? primaryFamily : getQcf4FallbackFamily(riwaya),
    loadedCount: results.filter((result) => result.loaded).length,
    failedCount: results.filter((result) => !result.loaded).length,
    hasFailures: results.some((result) => !result.loaded),
  };
}

export function hasQcf4FontLoadFailed(family) {
  return failedFamilies.has(family);
}
