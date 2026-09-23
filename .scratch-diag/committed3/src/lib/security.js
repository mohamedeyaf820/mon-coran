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
  "facebook.com",
  "www.facebook.com",
  "quran.com",
  "raw.githubusercontent.com",
  "alquran.cloud",
  "api.alquran.cloud",
  "fonts.qurancomplex.gov.sa",
]);

const BLOCKED_SVG_TAGS = new Set([
  "script",
  "style",
  "use",
  "foreignobject",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
]);

function removeNode(node) {
  if (!node?.parentNode) return;
  node.parentNode.removeChild(node);
}

function getSvgElements(doc) {
  const root = doc?.documentElement;
  if (!root) return [];
  return [root, ...Array.from(root.getElementsByTagName?.("*") || [])];
}

export function sanitizeSvgMarkup(svg) {
  if (typeof window === "undefined") return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(svg || ""), "image/svg+xml");
    if (
      String(doc?.documentElement?.tagName || "").toLowerCase() !== "svg" ||
      doc.getElementsByTagName?.("parsererror")?.length
    ) {
      return "";
    }

    getSvgElements(doc).forEach((element) => {
      const tag = String(element.tagName || "").toLowerCase();
      if (BLOCKED_SVG_TAGS.has(tag) || !ALLOWED_SVG_TAGS.has(tag)) {
        removeNode(element);
        return;
      }

      Array.from(element.attributes || []).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const valueRaw = String(attribute.value || "");
        const value = valueRaw.toLowerCase();
        const compactValue = value.replace(/[\u0000-\u0020]+/g, "");

        if (
          name.startsWith("on") ||
          ["src", "srcset", "poster", "action", "formaction"].includes(name)
        ) {
          element.removeAttribute(attribute.name);
          return;
        }

        if (
          name === "style" ||
          compactValue.includes("javascript:") ||
          compactValue.includes("vbscript:") ||
          compactValue.includes("data:text/html") ||
          compactValue.includes("expression(") ||
          compactValue.includes("@import") ||
          compactValue.includes("-moz-binding")
        ) {
          element.removeAttribute(attribute.name);
          return;
        }

        if (name === "href" || name === "xlink:href") {
          const isFragmentRef = valueRaw.trim().startsWith("#");
          if (!isFragmentRef || value.startsWith("javascript:") || value.startsWith("data:")) {
            element.removeAttribute(attribute.name);
          }
          return;
        }

        const urlReferences = [...valueRaw.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)];
        if (
          urlReferences.some((match) => !String(match[2] || "").trim().startsWith("#"))
        ) {
          element.removeAttribute(attribute.name);
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

const ALLOWED_HTML_ATTRIBUTES = new Set(["class", "title", "lang", "dir"]);

function isSafeHtmlAttribute(name, value) {
  if (!ALLOWED_HTML_ATTRIBUTES.has(name)) return false;
  if (name === "dir") return ["ltr", "rtl", "auto"].includes(value.toLowerCase());
  if (name === "lang") return /^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/i.test(value);
  if (name === "class") return /^[a-z0-9 _-]{0,160}$/i.test(value);
  return value.length <= 300;
}

export function sanitizeHtml(html) {
  if (!html || typeof html !== "string" || typeof DOMParser === "undefined") return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const browserBody = doc.body;
    const root = browserBody || doc.documentElement;
    if (!root) return "";
    const walk = (node) => {
      if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        if (!ALLOWED_HTML_TAGS.has(tag)) {
          removeNode(node);
          return;
        }
        const attrs = [...node.attributes];
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          if (!isSafeHtmlAttribute(name, String(attr.value || ""))) {
            node.removeAttribute(attr.name);
          }
        }
      }
      const children = [...node.childNodes];
      for (const child of children) {
        walk(child);
      }
    };
    if (browserBody) {
      const children = [...root.childNodes];
      for (const child of children) walk(child);
      return browserBody.innerHTML;
    }
    if (!ALLOWED_HTML_TAGS.has(String(root.tagName || "").toLowerCase())) {
      return "";
    }
    walk(root);
    if (typeof XMLSerializer !== "undefined") {
      return new XMLSerializer().serializeToString(root);
    }
    return "";
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
