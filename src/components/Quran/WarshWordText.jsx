import React from 'react';

const TAJWID_FALLBACK_COLORS = {
    ghunna: '#09b000', idgham: '#ababab', ikhfa: '#09b000', iqlab: '#00b4e0',
    qalqala: '#00b4e0', madd: '#c09725', 'madd-normal': '#c09725',
    'madd-separated': '#e67b00', 'madd-connected': '#ff0000',
    'lam-shamsiyya': '#ababab', tafkhim: '#134fe1', silent: '#ababab',
    naql: '#e67b00', tashil: '#09b000', ibdal: '#e67b00',
    'madd-badal': '#e67b00', 'sila-kubra': '#e67b00', 'tarqiq-ra': '#09b000',
    'idgham-warsh': '#ababab',
};

/**
 * WarshWordText – renders Unicode Warsh text.
 * Falls back to plain text if no tajweed.
 *
 * Props:
 *  words         - Array of words (strings)
 *  highlightIdx  - Current word index for karaoke highlighting
 *  tajweedColors - Optional rule-ID array per word
 */
const WarshWordText = React.memo(function WarshWordText({ words, highlightIdx, tajweedColors, markerFlags }) {
    if (!words || words.length === 0) return null;

    return (
        <span className="warsh-unicode-text inline-flex flex-wrap gap-x-[0.3em] gap-y-1" dir="rtl">
            {words.map((word, i) => {
                const isMarkerToken = Boolean(markerFlags?.[i]);
                let cls = 'warsh-unicode-word';

                if (highlightIdx !== undefined && highlightIdx !== null) {
                    if (i < highlightIdx) cls += ' wbw-read';
                    else if (i === highlightIdx) cls += ' wbw-current';
                    else cls += ' wbw-upcoming';
                }

                if (isMarkerToken) cls += ' wbw-marker';

                const ruleId = tajweedColors?.[i];
                const wordStyle = {
                    fontFamily: 'var(--qd-font-family, var(--font-quran-warsh, var(--font-quran, "Amiri Quran", serif)))',
                };
                if (ruleId) wordStyle.color = `var(--tajwid-${ruleId}, ${TAJWID_FALLBACK_COLORS[ruleId] || 'inherit'})`;

                return (
                    <span key={i} className={cls} style={wordStyle}>
                        {word}
                    </span>
                );
            })}
        </span>
    );
});

export default WarshWordText;
