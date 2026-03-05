#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rewrites the hm-* section in index.css with the new QWB-inspired design."""

INDEX_PATH = "e:/mon coran/src/styles/index.css"

with open(INDEX_PATH, encoding="utf-8") as f:
    all_lines = f.readlines()

# Find the hm-* section start marker
cut = None
for i, line in enumerate(all_lines):
    if "HOME PAGE" in line and "hm-*" in line:
        # Go back 3 lines to capture the comment opener
        cut = max(0, i - 3)
        break

if cut is None:
    # fallback: keep first 2600 lines
    cut = 2600

base = "".join(all_lines[:cut])
print(f"Keeping {cut} lines of existing CSS")

HM = """
/* ═══════════════════════════════════════════════════════════════
   HOME PAGE  (hm-*)  —  Premium v4 · QWB-inspired
   ═══════════════════════════════════════════════════════════════ */

/* ── page root ── */
.hm-page {
    min-height: 100%;
    padding-bottom: 5rem;
    overflow-x: hidden;
}

/* ════════════════════════════════════
   HERO
   ════════════════════════════════════ */
.hm-hero {
    position: relative;
    overflow: hidden;
    background: linear-gradient(
        150deg,
        var(--primary) 0%,
        color-mix(in srgb, var(--primary) 60%, #000 40%) 100%
    );
    padding: 3rem 2rem 3.5rem;
}

/* Geometric SVG watermark */
.hm-hero-geom {
    position: absolute;
    inset-inline-end: -2%;
    top: -10%;
    width: 55%;
    max-width: 380px;
    height: auto;
    color: #fff;
    pointer-events: none;
    opacity: 1;
}

/* Two-column layout */
.hm-hero-body {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    flex-wrap: wrap;
    max-width: 900px;
}

.hm-hero-left {
    flex: 1;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

/* Riwaya chip */
.hm-riwaya-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.22);
    color: rgba(255,255,255,0.88);
    font-size: 0.7rem;
    font-weight: 700;
    font-family: var(--font-ui);
    letter-spacing: 0.05em;
    padding: 0.28rem 0.75rem;
    border-radius: 9999px;
    width: fit-content;
    backdrop-filter: blur(4px);
}

.hm-riwaya-chip i { font-size: 0.65rem; opacity: 0.8; }

/* Main Arabic title */
.hm-hero-title {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: clamp(2rem, 5.5vw, 3rem);
    color: #fff;
    font-weight: normal;
    line-height: 1.5;
    text-shadow: 0 2px 16px rgba(0,0,0,0.15);
    margin: 0;
}

.hm-hero-sub {
    font-family: var(--font-ui);
    font-size: 0.88rem;
    color: rgba(255,255,255,0.62);
    line-height: 1.5;
    letter-spacing: 0.02em;
}

/* Daily verse card */
.hm-hero-verse {
    flex: 1;
    min-width: 220px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.16);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 1rem 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.hm-verse-label {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.hm-verse-label i { font-size: 0.55rem; color: var(--gold); }

.hm-verse-text {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: 1.15rem;
    color: rgba(255,255,255,0.95);
    line-height: 2;
    direction: rtl;
    text-align: center;
    margin: 0;
}

.hm-verse-ref {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    color: rgba(255,255,255,0.42);
    text-align: center;
}

/* ════════════════════════════════════
   GENERIC SECTION WRAPPER
   ════════════════════════════════════ */
.hm-section {
    padding: 2rem 1.75rem 0;
}

.hm-section--list {
    padding: 2rem 0 0;
}

/* Section title like QWB */
.hm-sec-title {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0 0 1rem;
}

/* ════════════════════════════════════
   CONTINUE READING BAR
   ════════════════════════════════════ */
.hm-continue {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0.9rem 1.1rem;
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    border-radius: 16px;
    cursor: pointer;
    outline: none;
    box-shadow: var(--shadow-xs);
    transition:
        border-color 0.18s,
        box-shadow 0.18s,
        transform 0.14s;
    color: inherit;
    text-align: start;
}

.hm-continue:hover {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.07), var(--shadow-md);
    transform: translateY(-1px);
}

.hm-continue:active { transform: scale(0.99); }

.hm-continue-icon {
    width: 46px; height: 46px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 14px;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 1.2rem;
    flex-shrink: 0;
    border: 1.5px solid rgba(var(--primary-rgb), 0.13);
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
}

.hm-continue:hover .hm-continue-icon { transform: scale(1.1) rotate(-4deg); }

.hm-continue-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
}

.hm-continue-label {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--primary);
}

.hm-continue-pos {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: 1.05rem;
    color: var(--text-primary);
    direction: rtl;
    text-align: end;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.4rem;
}

.hm-continue-dot {
    color: var(--text-muted);
    font-family: var(--font-ui);
    font-size: 0.9rem;
}

.hm-continue-arrow {
    color: var(--text-muted);
    font-size: 0.7rem;
    flex-shrink: 0;
    transition: transform 0.15s;
}

.hm-continue:hover .hm-continue-arrow { transform: translateX(-3px); }
[dir="rtl"] .hm-continue:hover .hm-continue-arrow { transform: translateX(3px); }

/* ════════════════════════════════════
   QUICK ACCESS STRIP
   ════════════════════════════════════ */
.hm-quick-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.65rem;
}

.hm-quick-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 1rem 0.5rem 0.85rem;
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    border-radius: 16px;
    cursor: pointer;
    outline: none;
    box-shadow: var(--shadow-xs);
    transition:
        border-color 0.16s,
        background 0.16s,
        transform 0.15s,
        box-shadow 0.15s;
    color: inherit;
    text-align: center;
}

.hm-quick-pill:hover {
    border-color: var(--primary);
    background: var(--primary-light);
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
}

.hm-quick-pill:active { transform: translateY(0) scale(0.95); }

.hm-quick-icon {
    width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 13px;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 1.05rem;
    border: 1.5px solid rgba(var(--primary-rgb), 0.12);
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s;
}

.hm-quick-pill:hover .hm-quick-icon {
    transform: scale(1.12);
    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.22);
}

.hm-quick-ar {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: 0.95rem;
    color: var(--text-primary);
    line-height: 1.5;
    direction: rtl;
}

.hm-quick-en {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

/* ════════════════════════════════════
   BOOKMARKS / NOTES TABS
   ════════════════════════════════════ */
.hm-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1.5px solid var(--border);
    margin-bottom: 0;
}

.hm-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    background: transparent;
    border: none;
    border-bottom: 2.5px solid transparent;
    margin-bottom: -1.5px;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    transition: color 0.15s, border-color 0.15s;
    outline: none;
    white-space: nowrap;
}

.hm-tab i { font-size: 0.72rem; }
.hm-tab:hover { color: var(--text-secondary); }

.hm-tab--on {
    color: var(--primary);
    border-bottom-color: var(--primary);
}

.hm-tab-pane {
    min-height: 80px;
    padding: 0.5rem 0;
}

/* ════════════════════════════════════
   GENERIC LIST ROW (bookmarks / notes / suggestions)
   ════════════════════════════════════ */
.hm-list-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    width: 100%;
    padding: 0.75rem 0.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: start;
    color: inherit;
    border-bottom: 1px solid var(--border-light);
    transition: background 0.13s;
    outline: none;
    border-radius: 0;
}

.hm-list-row:first-child { border-top: 1px solid var(--border-light); }
.hm-list-row:hover { background: var(--hover-bg); }
.hm-list-row:last-child { border-bottom: none; }

.hm-list-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 0.82rem;
    flex-shrink: 0;
    border: 1px solid rgba(var(--primary-rgb), 0.1);
}

.hm-list-num {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(var(--gold-rgb, 184,134,11), 0.1);
    color: var(--gold);
    font-size: 0.72rem;
    font-weight: 800;
    font-family: var(--font-ui);
    flex-shrink: 0;
    border: 1px solid rgba(var(--gold-rgb, 184,134,11), 0.15);
}

.hm-list-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.hm-list-ar {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: 1rem;
    color: var(--text-primary);
    direction: rtl;
    text-align: end;
    line-height: 1.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hm-list-sub {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hm-list-excerpt {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin-top: 0.1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.hm-list-note { font-style: italic; color: var(--text-muted); }

.hm-list-caret {
    color: var(--text-muted);
    font-size: 0.65rem;
    flex-shrink: 0;
    transition: transform 0.14s;
}
.hm-list-row:hover .hm-list-caret { transform: translateX(-2px); }
[dir="rtl"] .hm-list-row:hover .hm-list-caret { transform: translateX(2px); }

/* ════════════════════════════════════
   SURAH / JUZ LIST CONTROLS
   ════════════════════════════════════ */
.hm-list-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0 1.75rem 1rem;
}

/* Segmented control */
.hm-seg {
    display: flex;
    background: var(--bg-secondary);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 3px;
    gap: 2px;
    flex-shrink: 0;
}

.hm-seg-btn {
    padding: 0.38rem 1.1rem;
    border: none;
    background: transparent;
    border-radius: 9px;
    font-family: var(--font-ui);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    outline: none;
    transition: all 0.16s;
    white-space: nowrap;
}

.hm-seg-btn:hover { color: var(--text-secondary); }

.hm-seg-btn--on {
    background: var(--bg-card);
    color: var(--primary);
    box-shadow: var(--shadow-xs);
    border: 1px solid var(--border);
}

/* Search */
.hm-search-box {
    flex: 1;
    min-width: 150px;
    position: relative;
}

.hm-search-ico {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    inset-inline-start: 0.85rem;
    color: var(--text-muted);
    font-size: 0.72rem;
    pointer-events: none;
}

.hm-search-input {
    width: 100%;
    padding: 0.55rem 2.3rem;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    background: var(--bg-card);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 0.84rem;
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s;
    -webkit-appearance: none;
}

.hm-search-input:hover { border-color: var(--border-strong); }
.hm-search-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
}

.hm-search-clear {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    inset-inline-end: 0.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 0.72rem;
    padding: 0.1rem;
    outline: none;
    transition: color 0.12s;
}
.hm-search-clear:hover { color: var(--text-secondary); }

/* ════════════════════════════════════
   SURAH ROWS  (QWB style)
   ════════════════════════════════════ */
.hm-list {
    border-top: 1px solid var(--border-light);
}

.hm-surah-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0.9rem 1.75rem;
    border: none;
    background: transparent;
    border-bottom: 1px solid var(--border-light);
    cursor: pointer;
    text-align: start;
    color: inherit;
    outline: none;
    transition:
        background 0.13s,
        border-inline-start-color 0.15s;
    border-inline-start: 3px solid transparent;
    position: relative;
}

.hm-surah-row:hover {
    background: var(--hover-bg);
    border-inline-start-color: rgba(var(--primary-rgb), 0.35);
}

.hm-surah-row--active {
    background: var(--primary-light);
    border-inline-start-color: var(--primary) !important;
}

/* Number badge */
.hm-row-num-badge {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 800;
    flex-shrink: 0;
    border: 1.5px solid var(--border);
    transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.hm-surah-row:hover .hm-row-num-badge {
    background: rgba(var(--primary-rgb), 0.08);
    color: var(--primary);
    border-color: rgba(var(--primary-rgb), 0.15);
}

.hm-surah-row--active .hm-row-num-badge {
    background: var(--primary);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.3);
}

.hm-row-num-badge--juz {
    background: rgba(var(--gold-rgb, 184,134,11), 0.08) !important;
    color: var(--gold) !important;
    border-color: rgba(var(--gold-rgb, 184,134,11), 0.18) !important;
}

/* Center meta column */
.hm-row-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
}

.hm-row-name-en {
    font-family: var(--font-ui);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hm-surah-row--active .hm-row-name-en { color: var(--primary); }

.hm-row-ayah-count {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
}

/* Arabic name — large, right side (like QWB) */
.hm-row-name-ar {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: 1.35rem;
    color: var(--text-primary);
    direction: rtl;
    flex-shrink: 0;
    line-height: 1.6;
    transition: color 0.15s;
}

.hm-surah-row--active .hm-row-name-ar { color: var(--primary); }

/* Mini badges inside ayah count */
.hm-mini-badge {
    font-size: 0.55rem;
    font-weight: 800;
    padding: 0.08rem 0.38rem;
    border-radius: 9999px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-family: var(--font-ui);
}

.hm-badge--meccan {
    background: rgba(184,134,11,0.1);
    color: var(--gold);
    border: 1px solid rgba(184,134,11,0.2);
}

.hm-badge--medinan {
    background: rgba(var(--primary-rgb), 0.08);
    color: var(--primary);
    border: 1px solid rgba(var(--primary-rgb), 0.14);
}

/* ════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════ */
.hm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    padding: 2.5rem 1rem;
    text-align: center;
}

.hm-empty-ico {
    font-size: 2rem;
    color: var(--text-muted);
    opacity: 0.3;
}

.hm-empty-txt {
    font-family: var(--font-ui);
    font-size: 0.82rem;
    color: var(--text-muted);
    max-width: 240px;
    line-height: 1.5;
    margin: 0;
}

/* ════════════════════════════════════
   RESPONSIVE
   ════════════════════════════════════ */
@media (max-width: 560px) {
    .hm-hero {
        padding: 2rem 1.25rem 2.5rem;
    }

    .hm-hero-body {
        flex-direction: column;
        gap: 1.25rem;
    }

    .hm-hero-geom {
        width: 65%;
        opacity: 0.08;
    }

    .hm-hero-title {
        font-size: 1.9rem;
    }

    .hm-section {
        padding: 1.5rem 1.1rem 0;
    }

    .hm-section--list { padding: 1.5rem 0 0; }

    .hm-list-controls {
        padding: 0 1.1rem 0.75rem;
        flex-direction: row;
    }

    .hm-quick-strip {
        grid-template-columns: repeat(4, 1fr);
        gap: 0.45rem;
    }

    .hm-quick-icon { width: 36px; height: 36px; font-size: 0.9rem; }
    .hm-quick-ar   { font-size: 0.85rem; }

    .hm-surah-row {
        padding: 0.75rem 1.1rem;
        gap: 0.75rem;
    }

    .hm-row-name-ar { font-size: 1.15rem; }
}
"""

with open(INDEX_PATH, "w", encoding="utf-8") as f:
    f.write(base + HM)

lines = open(INDEX_PATH, encoding="utf-8").readlines()
print(f"index.css: {len(lines)} lignes")
