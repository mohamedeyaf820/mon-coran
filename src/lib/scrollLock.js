/**
 * Overlay scroll lock.
 *
 * The app does not scroll on <body>: #main-content is the scroll container
 * (overflow-y-auto), so locking the body alone leaves the page behind an
 * overlay scrolling. The counter lets nested overlays (sheet above modal)
 * share one lock: the last one to close restores the original styles.
 */

let lockCount = 0;
let saved = null;

export function lockAppScroll() {
  if (typeof document === "undefined") return () => {};
  lockCount += 1;
  if (lockCount === 1) {
    const scroller = document.getElementById("main-content");
    saved = {
      body: document.body.style.overflow,
      scroller: scroller ? scroller.style.overflow : null,
      scrollerEl: scroller,
    };
    document.body.style.overflow = "hidden";
    if (scroller) scroller.style.overflow = "hidden";
  }
  return unlockAppScroll;
}

export function unlockAppScroll() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && saved) {
    document.body.style.overflow = saved.body;
    if (saved.scrollerEl) saved.scrollerEl.style.overflow = saved.scroller || "";
    saved = null;
  }
}
