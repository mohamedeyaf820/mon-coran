const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["https:", "mailto:"]);

const ALLOWED_EXTERNAL_HOSTS = new Set([
  "wa.me",
  "t.me",
  "x.com",
  "twitter.com",
  "quran.com",
  "alquran.cloud",
  "api.alquran.cloud",
  "fonts.qurancomplex.gov.sa",
  "archive.org",
  "www.archive.org",
]);

export function sanitizeSvgMarkup(svg) {
  if (typeof window === "undefined") return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(svg || ""), "image/svg+xml");

    doc.querySelectorAll("script,foreignObject").forEach((element) => {
      element.remove();
    });

    doc.querySelectorAll("*").forEach((element) => {
      [...element.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = String(attribute.value || "").toLowerCase();

        if (name.startsWith("on")) {
          element.removeAttribute(attribute.name);
          return;
        }

        if ((name === "href" || name === "xlink:href") && value.startsWith("javascript:")) {
          element.removeAttribute(attribute.name);
        }
      });
    });

    return new XMLSerializer().serializeToString(doc.documentElement);
  } catch {
    return "";
  }
}

export function isAllowedExternalUrl(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Keep mailto as valid for sharing flows.
  if (trimmed.toLowerCase().startsWith("mailto:")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) return false;
    return ALLOWED_EXTERNAL_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function openExternalUrl(url, target = "_blank", features = "noopener,noreferrer") {
  if (typeof window === "undefined") return false;
  if (!isAllowedExternalUrl(url)) return false;
  window.open(url, target, features);
  return true;
}
