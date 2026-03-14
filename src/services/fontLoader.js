const GOOGLE_FONTS_BY_ID = {
  amiri: "family=Amiri:wght@400;700",
  "noto-naskh": "family=Noto+Naskh+Arabic:wght@400;500;600;700",
  "noto-naskh-arabic": "family=Noto+Naskh+Arabic:wght@400;500;600;700",
  lateef: "family=Lateef:wght@400;700",
  "markazi-text": "family=Markazi+Text:wght@400;500;600;700",
  "el-messiri": "family=El+Messiri:wght@400;500;600;700",
  "reem-kufi": "family=Reem+Kufi:wght@400;500;600;700",
  "aref-ruqaa": "family=Aref+Ruqaa:wght@400;700",
  cairo: "family=Cairo:wght@400;500;600;700;800",
  harmattan: "family=Harmattan:wght@400;500;600;700",
  mada: "family=Mada:wght@300;400;500;600;700;800",
  tajawal: "family=Tajawal:wght@300;400;500;700;800;900",
  lemonada: "family=Lemonada:wght@300;400;500;600;700",
  jomhuria: "family=Jomhuria",
  rakkas: "family=Rakkas",
  marhey: "family=Marhey:wght@300;400;500;600;700",
  mirza: "family=Mirza:wght@400;500;600;700",
};

const loadedFontIds = new Set();
const fontPromises = new Map();

function ensurePreconnect(url) {
  if (typeof document === "undefined") return;
  if (document.head.querySelector(`link[rel="preconnect"][href="${url}"]`)) {
    return;
  }
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = url;
  if (url.includes("gstatic")) {
    link.crossOrigin = "anonymous";
  }
  document.head.appendChild(link);
}

function loadStylesheet(href, key) {
  if (fontPromises.has(key)) return fontPromises.get(key);
  const promise = new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }
    if (document.head.querySelector(`link[data-font-loader="${key}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.fontLoader = key;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  fontPromises.set(key, promise);
  return promise;
}

export function ensureFontLoaded(fontId) {
  const familyQuery = GOOGLE_FONTS_BY_ID[fontId];
  if (!familyQuery || loadedFontIds.has(fontId)) {
    return Promise.resolve();
  }
  ensurePreconnect("https://fonts.googleapis.com");
  ensurePreconnect("https://fonts.gstatic.com");
  loadedFontIds.add(fontId);
  return loadStylesheet(
    `https://fonts.googleapis.com/css2?${familyQuery}&display=swap`,
    `font-${fontId}`,
  );
}
