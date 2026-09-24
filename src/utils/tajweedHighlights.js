/**
 * Transient Tajweed guides painted with the CSS Custom Highlight API: the rule
 * the pointer is over, and the word being recited. Both are background tints,
 * which never change the ink of a glyph and therefore never re-shape it.
 *
 * The rule colours themselves are NOT highlights — colouring a sub-word range
 * makes Chromium re-shape that range and print detached Arabic strokes. They
 * are gradient bands clipped to the whole word; see src/utils/tajweedWordPaint.js.
 *
 * Highlight names live in CSS (`::highlight(tajwid-hover)`,
 * `::highlight(tajwid-playing)`).
 */

export const TAJWEED_HOVER_HIGHLIGHT = "tajwid-hover";

export function supportsTajweedHighlights() {
  if (typeof window === "undefined" || typeof CSS === "undefined") return false;
  // WebKit paints Highlight ranges by re-shaping each sub-run of the text
  // node: on Arabic the harakat and joined forms detach from their word
  // (verified on iPhone Safari/Chrome with the QPC faces, any Safari >= 17.4
  // that exposes the API). Keep WebKit on the word-level fallback, where
  // colour precision is reduced but text integrity is not.
  if (isWebkitEngine()) return false;
  return (
    typeof CSS.highlights !== "undefined" &&
    typeof globalThis.Highlight === "function"
  );
}

export function isWebkitEngine() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Every browser on iOS is WebKit, whatever brand the UA carries.
  if (/iPhone|iPad|iPod|CriOS|FxiOS/.test(ua)) return true;
  // macOS Safari (and iPadOS desktop mode, which reports Macintosh).
  return (
    /Version\/[\d.]+/.test(ua) &&
    /Safari\//.test(ua) &&
    !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua)
  );
}

function getHighlight(name) {
  let highlight = CSS.highlights.get(name);
  if (!highlight) {
    highlight = new globalThis.Highlight();
    CSS.highlights.set(name, highlight);
  }
  return highlight;
}

// StaticRange is preferred: live Range objects are re-validated by the
// browser on every DOM mutation, which adds up with hundreds of verses.
function createRange(node, start, end) {
  if (typeof globalThis.StaticRange === "function") {
    return new globalThis.StaticRange({
      startContainer: node,
      startOffset: start,
      endContainer: node,
      endOffset: end,
    });
  }
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range;
}

function clampRange(node, start, end) {
  if (!node || typeof node.data !== "string") return [0, 0];
  const max = node.data.length;
  const safeStart = Math.max(0, Math.min(start, max));
  const safeEnd = Math.max(safeStart, Math.min(end, max));
  return [safeStart, safeEnd];
}

let hoverRange = null;

export function setTajweedHoverRange(node, start, end) {
  clearTajweedHoverRange();
  if (!node) return;
  const [safeStart, safeEnd] = clampRange(node, start, end);
  if (safeEnd <= safeStart) return;
  hoverRange = createRange(node, safeStart, safeEnd);
  getHighlight(TAJWEED_HOVER_HIGHLIGHT).add(hoverRange);
}

export function clearTajweedHoverRange() {
  if (!hoverRange) return;
  CSS.highlights.get(TAJWEED_HOVER_HIGHLIGHT)?.delete(hoverRange);
  hoverRange = null;
}

export const TAJWEED_PLAYING_HIGHLIGHT = "tajwid-playing";
let playingRange = null;

/** Marks the word being recited (karaoke) without touching the DOM. */
export function setTajweedPlayingRange(node, start, end) {
  clearTajweedPlayingRange();
  if (!node) return;
  const [safeStart, safeEnd] = clampRange(node, start, end);
  if (safeEnd <= safeStart) return;
  playingRange = createRange(node, safeStart, safeEnd);
  getHighlight(TAJWEED_PLAYING_HIGHLIGHT).add(playingRange);
}

export function clearTajweedPlayingRange() {
  if (!playingRange) return;
  CSS.highlights.get(TAJWEED_PLAYING_HIGHLIGHT)?.delete(playingRange);
  playingRange = null;
}

/** Client rects covered by a character range (hit-testing, tooltip anchor). */
export function getTextRangeRects(node, start, end) {
  if (!node || !node.isConnected) return [];
  const [safeStart, safeEnd] = clampRange(node, start, end);
  if (safeEnd <= safeStart) return [];
  const range = document.createRange();
  range.setStart(node, safeStart);
  range.setEnd(node, safeEnd);
  return Array.from(range.getClientRects());
}

export function rectsContainPoint(rects, x, y, pad = 3) {
  return rects.some(
    (rect) => x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad,
  );
}

export function unionRects(rects) {
  if (!rects.length) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const rect of rects) {
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}
