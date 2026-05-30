const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["https:", "mailto:"]);
const ALLOWED_SVG_TAGS = new Set([
  "svg",
  "g",
  "defs",
  "radialgradient",
  "lineargradient",
  "stop",
  "rect",
  "circle",
  "path",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
]);

const ALLOWED_EXTERNAL_HOSTS = new Set([
  "wa.me",
  "t.me",
  "x.com",
  "twitter.com",
  "quran.com",
  "raw.githubusercontent.com",
  "alquran.cloud",
  "api.alquran.cloud",
  "fonts.qurancomplex.gov.sa",
]);

export function sanitizeSvgMarkup(svg) {
  if (typeof window === "undefined") return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(svg || ""), "image/svg+xml");

    doc
      .querySelectorAll("script,style,use,foreignObject,iframe,object,embed,link,meta")
      .forEach((element) => {
      element.remove();
    });

    doc.querySelectorAll("*").forEach((element) => {
      const tag = String(element.tagName || "").toLowerCase();
      if (!ALLOWED_SVG_TAGS.has(tag)) {
        element.remove();
        return;
      }

      [...element.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const valueRaw = String(attribute.value || "");
        const value = valueRaw.toLowerCase();

        if (name.startsWith("on")) {
          element.removeAttribute(attribute.name);
          return;
        }

        if (
          name === "style" &&
          (value.includes("javascript:") || value.includes("expression(") || value.includes("url("))
        ) {
          element.removeAttribute(attribute.name);
          return;
        }

        if (name === "href" || name === "xlink:href") {
          const isFragmentRef = valueRaw.trim().startsWith("#");
          if (!isFragmentRef || value.startsWith("javascript:") || value.startsWith("data:")) {
            element.removeAttribute(attribute.name);
          }
        }
      });
    });

    return new XMLSerializer().serializeToString(doc.documentElement);
  } catch {
    return "";
  }
}

const ALLOWED_HTML_TAGS = new Set([
  "span", "b", "i", "mark", "em", "strong", "br", "small", "sup", "sub",
  "u", "s", "del", "ins", "abbr", "code", "kbd", "samp", "var",
]);

export function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const walk = (node) => {
      if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        if (!ALLOWED_HTML_TAGS.has(tag)) {
          node.remove();
          return;
        }
        const attrs = [...node.attributes];
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          const value = attr.value.toLowerCase();
          if (
            name.startsWith("on") ||
            (name === "href" && (value.startsWith("javascript:") || value.startsWith("data:"))) ||
            (name === "src" && value.startsWith("javascript:")) ||
            (name === "style" && (value.includes("javascript:") || value.includes("expression(") || value.includes("behavior"))) ||
            name === "formaction"
          ) {
            node.removeAttribute(attr.name);
          }
        }
      }
      const children = [...node.childNodes];
      for (const child of children) {
        walk(child);
      }
    };
    walk(doc.body);
    return doc.body.innerHTML;
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
