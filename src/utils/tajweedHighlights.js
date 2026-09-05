/**
 * Tajweed colouring through the CSS Custom Highlight API.
 *
 * Wrapping every Tajweed rule in its own <span> splits a word into several
 * text runs. WebKit shapes each run on its own, so the letters next to a span
 * boundary lose their joined forms, and every engine loses the cursive
 * attachment of the kashida that carries a dagger alif (the coloured bars
 * floating under the word). Highlights colour character ranges of a single
 * text node instead, so the shaping engine always sees the whole word.
 *
 * Highlight names are `tajwid-<ruleId>`; their colours live in CSS
 * (`::highlight(tajwid-<ruleId>) { color: var(--tajwid-<ruleId>) }`).
 */

const HIGHLIGHT_PREFIX = "tajwid-";
export const TAJWEED_HOVER_HIGHLIGHT = "tajwid-hover";

export function supportsTajweedHighlights() {
  if (typeof window === "undefined" || typeof CSS === "undefined") return false;
  return (
    typeof CSS.highlights !== "undefined" &&
    typeof globalThis.Highlight === "function"
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
  const max = node.data.length;
  const safeStart = Math.max(0, Math.min(start, max));
  const safeEnd = Math.max(safeStart, Math.min(end, max));
  return [safeStart, safeEnd];
}

/**
 * Colours the given rule ranges of a text node.
 * @param {Text} node
 * @param {Array<{start:number,end:number,ruleId:string}>} rules UTF-16 offsets
 * @returns {() => void} cleanup removing the ranges again
 */
export function applyTajweedHighlights(node, rules) {
  const added = [];
  for (const rule of rules) {
    if (!rule?.ruleId) continue;
    const [start, end] = clampRange(node, rule.start, rule.end);
    if (end <= start) continue;
    const range = createRange(node, start, end);
    const highlight = getHighlight(HIGHLIGHT_PREFIX + rule.ruleId);
    highlight.add(range);
    added.push([highlight, range]);
  }
  return () => {
    for (const [highlight, range] of added) highlight.delete(range);
  };
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

export function rectsContainPoint(rects, x, y) {
  return rects.some(
    (rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom,
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
