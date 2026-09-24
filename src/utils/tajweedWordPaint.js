/**
 * Paint Tajweed rule colours over a fully shaped Arabic word.
 *
 * A word must stay one text run: any engine that sees the word as several runs
 * shapes each of them on its own, and the Mushaf faces then print detached
 * strokes (an alif separated from its lam, a haraka floating away from its
 * base letter). That rules out both per-rule <span>s and sub-word
 * ::highlight() ranges on the QPC/QCF faces.
 *
 * A text-clipped linear-gradient keeps the run whole: the browser shapes the
 * word once and the gradient only decides which ink each horizontal band of
 * that already-shaped glyph receives. The stops are percentages of the word's
 * own box, so they survive a font-size change; they are recomputed when the
 * face or the layout changes.
 *
 * The gradient is published as --tajweed-paint and applied by CSS
 * (.is-tajweed-painted in tailwind.css) so the word states (hover, active,
 * focus, playing) can override the paint instead of losing it.
 */

import { isWebkitEngine } from "./tajweedHighlights.js";

const BASE_INK = "var(--reader-page-ink, currentColor)";
const RULE_ID_RE = /^[a-z-]+$/;
// A class, not a data attribute: PurgeCSS only keeps a selector whose name
// survives as a token in the built JS, and dataset keys do not carry it.
export const PAINTED_CLASS = "is-tajweed-painted";
const PERCENT = (value) => `${Math.round(value * 1000) / 10}%`;

// WebKit makes the fill transparent but clips the gradient to a few glyph
// fragments (verified on WebKit: painted words render near-invisible), so on
// that engine words are coloured whole instead of band by band.
export const CLIP_PAINT_SUPPORTED = !isWebkitEngine();

export function paintTajweedWord(word, ranges) {
  const node = word?.firstChild;
  if (node?.nodeType !== Node.TEXT_NODE || !ranges?.length) return;
  const box = word.getBoundingClientRect();
  if (!box.width) return;

  const stripes = [];
  const range = document.createRange();
  for (const rule of ranges) {
    if (!RULE_ID_RE.test(rule.ruleId || "")) continue;
    if (rule.start < 0 || rule.end > node.length || rule.end <= rule.start) continue;
    range.setStart(node, rule.start);
    range.setEnd(node, rule.end);
    const ink = range.getBoundingClientRect();
    if (!ink.width) continue;
    const left = Math.max(0, Math.min(100, ((ink.left - box.left) / box.width) * 100));
    const right = Math.max(left, Math.min(100, ((ink.right - box.left) / box.width) * 100));
    if (right > left) stripes.push({ left, right, ruleId: rule.ruleId });
  }
  if (!stripes.length) return;

  stripes.sort((a, b) => a.left - b.left);
  const stops = [];
  let cursor = 0;
  for (const stripe of stripes) {
    if (stripe.left < cursor) continue;
    const colour = `var(--tajwid-${stripe.ruleId})`;
    stops.push(`${BASE_INK} ${PERCENT(cursor / 100)}`, `${BASE_INK} ${PERCENT(stripe.left / 100)}`,
      `${colour} ${PERCENT(stripe.left / 100)}`, `${colour} ${PERCENT(stripe.right / 100)}`);
    cursor = stripe.right;
  }
  stops.push(`${BASE_INK} ${PERCENT(cursor / 100)}`, `${BASE_INK} 100%`);

  word.style.setProperty("--tajweed-paint", `linear-gradient(to right, ${stops.join(", ")})`);
  word.classList.add(PAINTED_CLASS);
}

export function clearTajweedWordPaint(word) {
  if (!word?.classList.contains(PAINTED_CLASS)) return;
  word.style.removeProperty("--tajweed-paint");
  word.classList.remove(PAINTED_CLASS);
}
