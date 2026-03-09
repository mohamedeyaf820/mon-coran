#!/usr/bin/env python3
"""Append design improvements CSS to index.css"""

path = r"e:\mon coran\src\styles\index.css"
with open(path, "r", encoding="utf-8") as f:
    css = f.read()

css_lf = css.replace("\r\n", "\n")

# ── 1. Fix mobile grid: change 1-col at 520px to 2-col ────────────────────────
old_1col = "@media (max-width: 520px) {\n  .hp2-items--grid { grid-template-columns: 1fr; }"
new_2col = "@media (max-width: 520px) {\n  .hp2-items--grid { grid-template-columns: repeat(2, 1fr); }"
if old_1col in css_lf:
    css_lf = css_lf.replace(old_1col, new_2col, 1)
    print("✓ Mobile 2-column fix applied")
else:
    print("⚠ Mobile 1-col rule not found, checking alternate...")
    # Try without the auto formatting
    import re
    css_lf = re.sub(
        r'(@media \(max-width: 520px\) \{[^}]*\.hp2-items--grid \{) grid-template-columns: 1fr;',
        r'\1 grid-template-columns: repeat(2, 1fr);',
        css_lf,
        count=1
    )
    print("  → Applied via regex")

# ── 2. Append all design CSS at the end ──────────────────────────────────────
NEW_CSS = """

/* ════════════════════════════════════════════════════════════
   DESIGN IMPROVEMENTS — Immersive, Transitions, Progress,
   Glow, Typography
   ════════════════════════════════════════════════════════════ */

/* ── Immersive reading mode (auto-hide header) ─────────────── */
.hdr {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.35s ease;
  will-change: transform;
}
.immersive-mode .hdr {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}
.immersive-mode .app-main {
  padding-top: 0 !important;
}
/* Bring header back on touch/hover in immersive mode */
.immersive-mode:hover .hdr,
.immersive-mode:focus-within .hdr {
  /* controlled by JS state, not CSS hover */
}

/* ── Surah page transitions ────────────────────────────────── */
@keyframes surahFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.quran-display {
  animation: surahFadeIn 0.35s ease forwards;
}

/* ── Reading progress bar ──────────────────────────────────── */
.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  z-index: 9999;
  background: linear-gradient(
    90deg,
    var(--primary) 0%,
    var(--gold, #b8860b) 100%
  );
  transform-origin: left center;
  transform: scaleX(var(--reading-progress, 0));
  transition: transform 0.1s linear;
  pointer-events: none;
}
.immersive-mode .reading-progress-bar {
  top: 0;
}

/* ── Active playing ayah — golden glow ─────────────────────── */
.ayah-playing,
.qc-ayah-block.playing,
.mp-ayah-num.playing {
  position: relative;
}
.ayah-playing::before,
.qc-ayah-block.playing::before {
  content: "";
  position: absolute;
  inset: -4px -8px;
  border-radius: 12px;
  background: var(--ayah-playing-bg, rgba(200, 152, 14, 0.1));
  box-shadow: 0 0 20px rgba(var(--gold-rgb, 200, 152, 14), 0.25),
              inset 0 0 12px rgba(var(--gold-rgb, 200, 152, 14), 0.08);
  pointer-events: none;
  z-index: 0;
  animation: ayahGlowPulse 2s ease-in-out infinite;
}
@keyframes ayahGlowPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}

/* Golden side bar on playing ayah */
.qc-ayah-block.playing {
  border-inline-start: 3px solid var(--gold, #b8860b);
  padding-inline-start: calc(var(--ayah-indent, 0.5rem) + 0.25rem);
}

/* ── Typography adaptative (clamp pour arabique) ────────────── */
:root {
  --quran-font-min: 1.35rem;
  --quran-font-max: 2.2rem;
  --quran-font-clamp: clamp(var(--quran-font-min), calc(0.7rem + 3.5vw), var(--quran-font-max));
}
.ayah-text-ar {
  /* Supercedes the JS pixel value with fluid scaling */
  font-size: var(--quran-font-override, var(--quran-font-clamp)) !important;
}
.mushaf-line-text {
  font-size: var(--quran-font-override, clamp(1.2rem, calc(0.5rem + 2.8vw), 2rem)) !important;
}

/* ── OLED theme dark component overrides ────────────────────── */
[data-theme="oled"] .hdr {
  background: #000 !important;
  border-bottom-color: #111 !important;
}
[data-theme="oled"] .sidebar {
  background: #000 !important;
  border-inline-end-color: #111 !important;
}
[data-theme="oled"] .modal-overlay {
  background: rgba(0, 0, 0, 0.97) !important;
}
[data-theme="oled"] .modal-content {
  background: #050505 !important;
  border-color: #1a1a1a !important;
}

/* ── Sepia theme — reading area background color fix ─────────── */
[data-theme="sepia"] .app-main {
  background: var(--parchment-1);
}
[data-theme="sepia"] .quran-content {
  background: var(--mushaf-bg);
}

/* ── Responsive footnotes ───────────────────────────────────── */
@media (max-width: 375px) {
  .hp2-items--grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.4rem !important;
    padding: 0.5rem !important;
  }
  .hpg-card {
    min-height: 96px;
    padding: 0.6rem 0.65rem;
  }
  .hpg-card__ar { font-size: 0.95rem; }
}
"""

css_lf = css_lf.rstrip() + "\n" + NEW_CSS

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(css_lf)

print("✓ Design CSS appended to index.css")
