#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rewrites the hm-* section in index.css (lines 2601+)"""

INDEX_PATH = "e:/mon coran/src/styles/index.css"

# Read existing file, keep only lines 1-2600
with open(INDEX_PATH, encoding="utf-8") as f:
    all_lines = f.readlines()

base = "".join(all_lines[:2600])

HM_CSS = """
/* ══════════════════════════════════════════════════════════════
   HOME PAGE — hm-* classes — Premium v3
   ══════════════════════════════════════════════════════════════ */

/* ── page root ── */
.hm-page {
    min-height: 100%;
    padding-bottom: 3rem;
    overflow-x: hidden;
    animation: fadeInUp 0.28s ease;
}

/* ══════════ HERO ══════════ */
.hm-hero {
    position: relative;
    min-height: 210px;
    background: linear-gradient(
        135deg,
        var(--primary) 0%,
        color-mix(in srgb, var(--primary) 72%, #000) 100%
    );
    border-radius: 0 0 var(--r-xl) var(--r-xl);
    overflow: hidden;
    margin-bottom: 1.5rem;
    padding: 0 1.5rem 1.75rem;
    display: flex;
    align-items: flex-end;
}

.hm-hero-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.hm-hero-svg {
    position: absolute;
    top: -40%;
    right: -15%;
    width: 72%;
    height: auto;
    opacity: 0.07;
}

.hm-hero-inner {
    position: relative;
    width: 100%;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

/* Riwaya tag badge */
.hm-riwaya-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.85);
    font-size: 0.68rem;
    font-weight: 700;
    font-family: var(--font-ui);
    letter-spacing: 0.06em;
    padding: 0.22rem 0.7rem;
    border-radius: var(--r-pill);
    width: fit-content;
}

/* Main Arabic heading */
.hm-hero-ar {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: clamp(1.6rem, 5vw, 2.5rem);
    color: #fff;
    line-height: 1.6;
    text-shadow: 0 2px 12px rgba(0,0,0,0.18);
    font-weight: normal;
    margin: 0;
}

.hm-hero-sub {
    color: rgba(255,255,255,0.62);
    font-size: 0.78rem;
    font-family: var(--font-ui);
    letter-spacing: 0.04em;
}

/* Daily verse card inside hero */
.hm-daily-card {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: var(--r-lg);
    padding: 0.7rem 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
}

.hm-daily-label {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    font-family: var(--font-ui);
}

.hm-daily-text {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: 1.05rem;
    color: rgba(255,255,255,0.92);
    line-height: 1.9;
    direction: rtl;
}

.hm-daily-ref {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.45);
    font-family: var(--font-ui);
    text-align: end;
}

/* ══════════ BLOCKS ══════════ */
.hm-blk {
    padding: 0 1rem;
    margin-bottom: 1.25rem;
}

.hm-blk--grid {
    padding-bottom: 0;
}

/* ══════════ CONTINUE READING ══════════ */
.hm-continue {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    border-radius: var(--r-xl);
    padding: 0.7rem 0.8rem;
    cursor: pointer;
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s,
        transform 0.15s;
    box-shadow: var(--shadow-xs);
    text-align: start;
    color: inherit;
    gap: 0.5rem;
}

.hm-continue:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-md),
                0 0 0 3px rgba(var(--primary-rgb), 0.06);
    transform: translateY(-1px);
}

.hm-continue:active {
    transform: translateY(0) scale(0.995);
}

.hm-continue-left {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
}

.hm-continue-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 1.1rem;
    flex-shrink: 0;
    border: 1.5px solid rgba(var(--primary-rgb), 0.12);
}

.hm-continue-text {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    min-width: 0;
}

.hm-continue-label {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    color: var(--text-muted);
    text-transform: uppercase;
    font-family: var(--font-ui);
}

.hm-continue-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    font-family: var(--font-ui);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hm-continue-ayah {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-family: var(--font-ui);
}

.hm-continue-right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
}

.hm-surah-badge {
    background: var(--primary-light);
    color: var(--primary);
    border: 1px solid rgba(var(--primary-rgb), 0.12);
    border-radius: var(--r-md);
    padding: 0.28rem 0.65rem;
    font-size: 0.72rem;
    font-weight: 700;
    font-family: var(--font-ui);
    white-space: nowrap;
}

.hm-caret {
    color: var(--text-muted);
    font-size: 0.65rem;
    transition: transform 0.15s;
}

.hm-continue:hover .hm-caret {
    transform: translateX(-3px);
}

[dir="rtl"] .hm-continue:hover .hm-caret {
    transform: translateX(3px);
}

/* ══════════ SECTION HEADING ══════════ */
.hm-section-hd {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.75rem;
}

.hm-section-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(
        90deg,
        rgba(var(--primary-rgb), 0.3),
        transparent
    );
}

[dir="rtl"] .hm-section-line {
    background: linear-gradient(
        270deg,
        rgba(var(--primary-rgb), 0.3),
        transparent
    );
}

.hm-section-txt {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--primary);
    font-family: var(--font-ui);
    flex-shrink: 0;
    padding: 0 0.2rem;
}

/* ══════════ QUICK ACCESS PILLS ══════════ */
.hm-quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.6rem;
}

.hm-quick-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    padding: 0.72rem 0.4rem 0.65rem;
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    border-radius: var(--r-xl);
    cursor: pointer;
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s,
        transform 0.15s,
        background 0.15s;
    box-shadow: var(--shadow-xs);
    text-align: center;
    color: inherit;
}

.hm-quick-pill:hover {
    border-color: var(--primary);
    background: var(--primary-light);
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
}

.hm-quick-pill:active {
    transform: translateY(0) scale(0.96);
}

.hm-quick-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    background: var(--primary-light);
    color: var(--primary);
    border: 1.5px solid rgba(var(--primary-rgb), 0.1);
    transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
}

.hm-quick-pill:hover .hm-quick-icon {
    background: rgba(var(--primary-rgb), 0.15);
    box-shadow: 0 3px 10px rgba(var(--primary-rgb), 0.2);
    transform: scale(1.08);
}

.hm-quick-info {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    align-items: center;
}

.hm-quick-ar {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: 0.9rem;
    color: var(--text-primary);
    line-height: 1.4;
}

.hm-quick-en {
    font-size: 0.6rem;
    color: var(--text-muted);
    font-family: var(--font-ui);
    white-space: nowrap;
}

/* ══════════ BOOKMARK/NOTES TABS ══════════ */
.hm-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.65rem;
    border-bottom: 1.5px solid var(--border);
    padding-bottom: 0;
}

.hm-tab {
    padding: 0.42rem 0.85rem;
    background: transparent;
    border: none;
    border-bottom: 2.5px solid transparent;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
    font-family: var(--font-ui);
    transition: color 0.15s, border-color 0.15s;
    outline: none;
    margin-bottom: -1.5px;
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.hm-tab:hover {
    color: var(--text-secondary);
}

.hm-tab--active {
    color: var(--primary);
    border-bottom-color: var(--primary);
}

.hm-tab-body {
    min-height: 72px;
}

/* ══════════ LIST ROWS (bookmarks / history) ══════════ */
.hm-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.5rem;
    cursor: pointer;
    border-radius: var(--r-md);
    transition: background 0.14s;
    outline: none;
    border: none;
    background: transparent;
    width: 100%;
    text-align: start;
    color: inherit;
}

.hm-row:hover {
    background: var(--hover-bg);
}

.hm-row-ico {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 0.85rem;
    flex-shrink: 0;
    border: 1px solid rgba(var(--primary-rgb), 0.1);
}

.hm-row-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.hm-row-ar {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: 0.95rem;
    color: var(--text-primary);
    direction: rtl;
    text-align: end;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hm-row-sub {
    font-size: 0.7rem;
    color: var(--text-muted);
    font-family: var(--font-ui);
}

.hm-row-note {
    font-size: 0.72rem;
    color: var(--text-secondary);
    font-family: var(--font-ui);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.hm-row-num {
    flex-shrink: 0;
    background: var(--bg-tertiary);
    color: var(--text-muted);
    border-radius: 8px;
    padding: 0.18rem 0.5rem;
    font-size: 0.65rem;
    font-family: var(--font-ui);
    font-weight: 700;
}

/* empty state */
.hm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    color: var(--text-muted);
    text-align: center;
}

.hm-empty i {
    font-size: 1.8rem;
    opacity: 0.3;
}

.hm-empty-txt {
    font-size: 0.8rem;
    font-family: var(--font-ui);
}

/* ══════════ SURAHS / JUZ GRID HEAD ══════════ */
.hm-grid-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0 1rem 0.6rem;
}

/* Toggle pill tabs (Surah / Juz) */
.hm-pill-tabs {
    display: flex;
    background: var(--bg-secondary);
    border: 1.5px solid var(--border);
    border-radius: var(--r-pill);
    padding: 2px;
    gap: 2px;
}

.hm-pill-tab {
    padding: 0.3rem 0.9rem;
    border: none;
    background: transparent;
    border-radius: var(--r-pill);
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text-muted);
    font-family: var(--font-ui);
    cursor: pointer;
    transition: all 0.15s;
    outline: none;
}

.hm-pill-tab:hover {
    color: var(--text-secondary);
}

.hm-pill-tab--on {
    background: var(--bg-card);
    color: var(--primary);
    box-shadow: var(--shadow-xs);
    border: 1px solid var(--border);
}

/* Search bar */
.hm-search-wrap {
    position: relative;
    flex: 1;
    min-width: 160px;
    max-width: 260px;
}

.hm-search-ico {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    inset-inline-start: 0.75rem;
    color: var(--text-muted);
    font-size: 0.75rem;
    pointer-events: none;
}

.hm-search {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.1rem;
    border: 1.5px solid var(--border);
    border-radius: var(--r-xl);
    background: var(--bg-card);
    color: var(--text);
    font-size: 0.81rem;
    font-family: var(--font-ui);
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s;
    -webkit-appearance: none;
}

.hm-search:hover {
    border-color: var(--border-strong);
}

.hm-search:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
}

/* ══════════ SURAH / JUZ GRID ══════════ */
.hm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
    gap: 0.6rem;
    padding: 0 1rem 0.5rem;
}

.hm-surah-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.38rem;
    padding: 0.7rem 0.75rem;
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    border-radius: var(--r-xl);
    cursor: pointer;
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s,
        transform 0.15s,
        background 0.15s;
    box-shadow: var(--shadow-xs);
    text-align: inherit;
    color: inherit;
    overflow: hidden;
}

.hm-surah-card::before {
    content: "";
    position: absolute;
    top: 0;
    inset-inline-start: 0;
    width: 3px;
    height: 100%;
    background: transparent;
    border-radius: 0 2px 2px 0;
    transition: background 0.15s;
}

.hm-surah-card:hover::before {
    background: var(--primary);
}

.hm-surah-card:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.hm-surah-card:active {
    transform: translateY(0) scale(0.97);
}

.hm-surah-card--active,
.hm-surah-card--active:hover {
    border-color: var(--primary);
    background: var(--primary-light);
    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1), var(--shadow-sm);
}

.hm-surah-card--active::before {
    background: var(--primary) !important;
}

/* Number badge on card */
.hm-surah-num {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-light);
    color: var(--primary);
    font-weight: 800;
    font-size: 0.7rem;
    border: 1.5px solid rgba(var(--primary-rgb), 0.12);
    flex-shrink: 0;
    font-family: var(--font-ui);
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.hm-surah-card--active .hm-surah-num {
    background: var(--primary);
    color: white;
    border-color: transparent;
    box-shadow: 0 3px 8px rgba(var(--primary-rgb), 0.28);
}

.hm-surah-num--juz {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: rgba(var(--gold-rgb, 184,134,11), 0.1);
    color: var(--gold);
    border: 1.5px solid rgba(var(--gold-rgb, 184,134,11), 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 800;
    flex-shrink: 0;
    font-family: var(--font-ui);
}

.hm-surah-body {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    flex: 1;
    min-width: 0;
}

.hm-surah-ar {
    font-family: var(--font-quran), "Amiri", serif;
    font-size: 1.05rem;
    color: var(--text-primary);
    line-height: 1.6;
    direction: rtl;
    text-align: end;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hm-surah-en {
    font-size: 0.68rem;
    color: var(--text-muted);
    font-family: var(--font-ui);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hm-surah-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
    flex-wrap: wrap;
}

/* Type badges */
.hm-type-badge {
    font-size: 0.55rem;
    font-weight: 800;
    padding: 0.1rem 0.35rem;
    border-radius: 9999px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-family: var(--font-ui);
    border: 1px solid transparent;
}

.hm-badge--meccan {
    background: rgba(184,134,11,0.1);
    color: var(--gold);
    border-color: rgba(184,134,11,0.15);
}

.hm-badge--medinan {
    background: rgba(var(--primary-rgb), 0.08);
    color: var(--primary);
    border-color: rgba(var(--primary-rgb), 0.12);
}

.hm-badge--juz {
    background: rgba(var(--primary-rgb), 0.07);
    color: var(--primary);
    border-color: rgba(var(--primary-rgb), 0.1);
    font-size: 0.6rem;
}

.hm-ayah-cnt {
    font-size: 0.6rem;
    color: var(--text-muted);
    font-family: var(--font-ui);
    font-weight: 600;
    white-space: nowrap;
}

/* ══════════ RESPONSIVE ══════════ */
@media (max-width: 480px) {
    .hm-hero {
        min-height: 170px;
        padding: 0 1rem 1.25rem;
        border-radius: 0 0 var(--r-lg) var(--r-lg);
    }

    .hm-quick-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 0.45rem;
    }

    .hm-quick-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        font-size: 0.9rem;
    }

    .hm-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
    }

    .hm-grid-head {
        flex-direction: column;
        align-items: stretch;
    }

    .hm-search-wrap {
        max-width: 100%;
    }
}

@media (min-width: 640px) {
    .hm-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
}
"""

with open(INDEX_PATH, "w", encoding="utf-8") as f:
    f.write(base + "\n" + HM_CSS)

lines = open(INDEX_PATH, encoding="utf-8").readlines()
print(f"index.css rewritten: {len(lines)} lines")
