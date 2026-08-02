const DEFAULT_SHARE_ORIGIN = "https://mushafplus.netlify.app";

function normalizeVerseNumber(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeOrigin(origin) {
  if (!origin) return DEFAULT_SHARE_ORIGIN;

  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
      return DEFAULT_SHARE_ORIGIN;
    }
    return parsed.origin;
  } catch {
    return DEFAULT_SHARE_ORIGIN;
  }
}

export function cleanShareText(value) {
  if (value == null) return "";
  const raw = typeof value === "string" ? value : String(value);
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

export function getVerseShareUrl(surah, ayah, origin) {
  const runtimeOrigin = origin ?? (typeof window !== "undefined" ? window.location?.origin : "");
  const base = normalizeOrigin(runtimeOrigin);
  return `${base}/surah/${normalizeVerseNumber(surah)}/${normalizeVerseNumber(ayah)}`;
}

export function createVerseSharePayload({
  surah,
  ayah,
  arabicText,
  translationText,
  surahName,
  lang = "fr",
  origin,
}) {
  const safeSurah = normalizeVerseNumber(surah);
  const safeAyah = normalizeVerseNumber(ayah);
  const arabic = cleanShareText(arabicText);
  const translation = cleanShareText(translationText);
  const fallbackName = lang === "ar" ? `سورة ${safeSurah}` : lang === "en" ? `Surah ${safeSurah}` : `Sourate ${safeSurah}`;
  const name = cleanShareText(surahName) || fallbackName;
  const reference = lang === "ar"
    ? `${name} · الآية ${safeAyah}`
    : lang === "en"
      ? `${name} · verse ${safeAyah}`
      : `${name} · verset ${safeAyah}`;
  const url = getVerseShareUrl(safeSurah, safeAyah, origin);
  const text = [arabic, translation, `— ${reference}`].filter(Boolean).join("\n\n");

  return {
    title: `${name} (${safeSurah}:${safeAyah}) · MushafPlus`,
    text,
    url,
    fullText: `${text}\n${url}`,
  };
}

export function createVerseShareTargets(payload) {
  const text = cleanShareText(payload?.text);
  const fullText = cleanShareText(payload?.fullText) || [text, payload?.url].filter(Boolean).join("\n");
  const url = payload?.url || DEFAULT_SHARE_ORIGIN;
  const title = cleanShareText(payload?.title) || "MushafPlus";
  const xText = text.length > 220 ? `${text.slice(0, 217).trimEnd()}…` : text;

  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(fullText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullText)}`,
  };
}

export async function writeTextToClipboard(value) {
  const text = String(value || "");
  if (!text) return false;

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // The textarea fallback below also works on older WebViews and denied Clipboard APIs.
  }

  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    return Boolean(document.execCommand?.("copy"));
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

export { DEFAULT_SHARE_ORIGIN };
