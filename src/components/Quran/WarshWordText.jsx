import React, { useMemo, useState, useEffect } from 'react';
import { getFontFamily, isFontPageLoaded, onFontLoadChange } from '../../services/warshService';

const TAJWID_FALLBACK_COLORS = {
    ghunna: '#09b000', idgham: '#ababab', ikhfa: '#09b000', iqlab: '#00b4e0',
    qalqala: '#00b4e0', madd: '#c09725', 'madd-normal': '#c09725',
    'madd-separated': '#e67b00', 'madd-connected': '#ff0000',
    'lam-shamsiyya': '#ababab', tafkhim: '#134fe1', silent: '#ababab',
    naql: '#e67b00', tashil: '#09b000', ibdal: '#e67b00',
    'madd-badal': '#e67b00', 'sila-kubra': '#e67b00', 'tarqiq-ra': '#09b000',
    'idgham-warsh': '#ababab',
};

function mapTajweedToQCF4(tajweedColors, qcf4Count) {
    if (!tajweedColors || tajweedColors.length === 0 || qcf4Count === 0) return null;
    const srcLen = tajweedColors.length;
    if (srcLen === qcf4Count) return tajweedColors;

    const result = [];
    for (let i = 0; i < qcf4Count; i++) {
        const rangeStart = Math.floor(i * srcLen / qcf4Count);
        const rangeEnd = Math.max(Math.floor((i + 1) * srcLen / qcf4Count), rangeStart + 1);
        const counts = {};
        let dominant = null;
        let maxCount = 0;
        for (let j = rangeStart; j < rangeEnd && j < srcLen; j++) {
            const rule = tajweedColors[j];
            if (rule) {
                const c = (counts[rule] || 0) + 1;
                counts[rule] = c;
                if (c > maxCount) { maxCount = c; dominant = rule; }
            }
        }
        result.push(dominant);
    }
    return result;
}

/**
 * WarshWordText – renders QCF4 PUA codepoints.
 * • Shows shimmer placeholders while fonts are loading.
 * • Falls back to hafsText (plain Arabic) if QCF4 fonts are unavailable after 7 s.
 *
 * Props:
 *  words         – Array of {p, c} word objects
 *  highlightIdx  – Current word index for karaoke highlighting
 *  tajweedColors – Optional rule-ID array per word
 *  fallbackText  – Plain Arabic string shown when fonts can't load
 */
const WarshWordText = React.memo(function WarshWordText({ words, highlightIdx, tajweedColors, fallbackText, markerFlags }) {
    // Re-render whenever a font finishes (or fails) loading
    const [fontTick, setFontTick] = useState(0);
    useEffect(() => {
        const unsub = onFontLoadChange(() => setFontTick(n => n + 1));
        return unsub;
    }, []);

    // 7-second grace period before activating the fallback
    const [graceExpired, setGraceExpired] = useState(false);
    useEffect(() => {
        setGraceExpired(false);
        const timer = setTimeout(() => setGraceExpired(true), 7000);
        return () => clearTimeout(timer);
    }, [words]);

    const qcf4Colors = useMemo(() => {
        if (!tajweedColors || tajweedColors.length === 0) return null;
        return mapTajweedToQCF4(tajweedColors, words.length);
    }, [tajweedColors, words.length]);

    const fontReadyFlags = useMemo(
        () => words.map((w) => isFontPageLoaded(w.p)),
        [words, fontTick],
    );

    const loadedCount = useMemo(
        () => fontReadyFlags.reduce((sum, isReady) => sum + (isReady ? 1 : 0), 0),
        [fontReadyFlags],
    );

    const allFontsReady = loadedCount === words.length;

    // Show plain-Arabic fallback when fonts never loaded after grace period
    if (graceExpired && loadedCount === 0 && fallbackText) {
        return (
            <span
                className="warsh-font-fallback"
                dir="rtl"
                title="Warsh — polices QCF4 indisponibles, affichage orthographe Ḥafṣ"
            >
                {fallbackText}
                {' '}
                <i
                    className="fas fa-exclamation-circle"
                    style={{ fontSize: '0.55em', opacity: 0.55, color: 'var(--gold)' }}
                />
            </span>
        );
    }

    return (
        <span className="warsh-qcf4-text" dir="rtl">
            {words.map((word, i) => {
                const fontReady = fontReadyFlags[i];
                const glyph = fontReady ? String.fromCodePoint(word.c) : '';
                const isMarkerToken = Boolean(markerFlags?.[i]);
                let cls = 'warsh-qcf4-word';
                if (!fontReady) cls += ' qcf4-loading';
                if (highlightIdx !== undefined && highlightIdx !== null) {
                    if (i < highlightIdx) cls += ' wbw-qcf4-read';
                    else if (i === highlightIdx) cls += ' wbw-qcf4-current';
                    else cls += ' wbw-qcf4-upcoming';
                }
                if (isMarkerToken) cls += ' wbw-qcf4-marker';
                const ruleId = qcf4Colors?.[i];
                const wordStyle = { fontFamily: `'${getFontFamily(word.p)}', serif` };
                if (ruleId) wordStyle.color = `var(--tajwid-${ruleId}, ${TAJWID_FALLBACK_COLORS[ruleId] || 'inherit'})`;
                return (
                    <span key={i} className={cls} style={wordStyle}>
                        {fontReady ? glyph : '\u00A0\u00A0'}
                    </span>
                );
            })}
            {!allFontsReady && (
                <span className="qcf4-font-loading-hint">
                    <i className="fas fa-spinner fa-spin" />
                </span>
            )}
        </span>
    );
});

export default WarshWordText;
