import React, { useMemo, useState, useEffect } from 'react';
import { getFontFamily, isFontPageLoaded, onFontLoadChange, areFontsLoading } from '../../services/warshService';

const TAJWID_FALLBACK_COLORS = {
    ghunna: '#1aaf5d', idgham: '#9b59b6', ikhfa: '#1abc9c', iqlab: '#2ecc71',
    qalqala: '#3498db', madd: '#e74c3c', 'madd-normal': '#d63384',
    'madd-separated': '#fd7e14', 'madd-connected': '#e91e90',
    'lam-shamsiyya': '#AAAAAA', tafkhim: '#4a86c8', silent: '#AAAAAA',
    naql: '#ff6b35', tashil: '#7c4dff', ibdal: '#FF5722',
    'madd-badal': '#e91e63', 'sila-kubra': '#0288d1', 'tarqiq-ra': '#00bcd4',
    'idgham-warsh': '#6a1b9a',
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
 * Shows shimmer placeholder while fonts are loading.
 */
const WarshWordText = React.memo(function WarshWordText({ words, highlightIdx, tajweedColors }) {
    // Track font loading state to force re-render when fonts finish loading
    const [, setFontTick] = useState(0);
    useEffect(() => {
        const unsub = onFontLoadChange(() => setFontTick(t => t + 1));
        return unsub;
    }, []);

    const qcf4Colors = useMemo(() => {
        if (!tajweedColors || tajweedColors.length === 0) return null;
        return mapTajweedToQCF4(tajweedColors, words.length);
    }, [tajweedColors, words.length]);

    // Check if any needed fonts are still loading
    const allFontsReady = useMemo(() => {
        return words.every(w => isFontPageLoaded(w.p));
    }, [words, /* dependency on font tick via state */]);

    return (
        <span className="warsh-qcf4-text" dir="rtl">
            {words.map((word, i) => {
                const fontReady = isFontPageLoaded(word.p);
                let cls = 'warsh-qcf4-word';
                if (!fontReady) cls += ' qcf4-loading';
                if (highlightIdx !== undefined && highlightIdx !== null) {
                    if (i < highlightIdx) cls += ' wbw-qcf4-read';
                    else if (i === highlightIdx) cls += ' wbw-qcf4-current';
                    else cls += ' wbw-qcf4-upcoming';
                }
                const ruleId = qcf4Colors?.[i];
                const wordStyle = { fontFamily: `'${getFontFamily(word.p)}', serif` };
                if (ruleId) wordStyle.color = `var(--tajwid-${ruleId}, ${TAJWID_FALLBACK_COLORS[ruleId] || 'inherit'})`;
                return (
                    <span key={i} className={cls} style={wordStyle}>
                        {fontReady ? String.fromCodePoint(word.c) : '\u00A0\u00A0'}
                    </span>
                );
            })}
            {!allFontsReady && (
                <span className="qcf4-font-loading-hint">
                    <i className="fas fa-spinner fa-spin"></i>
                </span>
            )}
        </span>
    );
});

export default WarshWordText;
