import React from 'react';

const TAJWID_FALLBACK_COLORS = {
    ghunna: '#26b55d', idgham: '#26b55d', ikhfa: '#26b55d', iqlab: '#26b55d',
    qalqala: '#00deff', madd: '#e30000', 'madd-normal': '#ffc1e0',
    'madd-separated': '#ff8e3b', 'madd-connected': '#ff5e8e',
    'lam-shamsiyya': '#999999', tafkhim: '#3c84d5', silent: '#999999',
    naql: '#ff8e3b', tashil: '#26b55d', ibdal: '#ff8e3b',
    'madd-badal': '#ff8e3b', 'sila-kubra': '#ff8e3b', 'tarqiq-ra': '#26b55d',
    'idgham-warsh': '#999999',
};

const WAQF_MARKER_SPLIT_RE = /([\u06d6-\u06dc])/u;
const WAQF_MARKER_CHAR_RE = /^[\u06d6-\u06dc]$/u;

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
        <span className="warsh-unicode-text inline" dir="rtl">
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
                    fontFamily: 'var(--qd-font-family, var(--font-quran-warsh, var(--font-quran, serif)))',
                };
                if (ruleId) wordStyle.color = `var(--tajwid-${ruleId}, ${TAJWID_FALLBACK_COLORS[ruleId] || 'inherit'})`;
                const parts = String(word).split(WAQF_MARKER_SPLIT_RE).filter(Boolean);

                return (
                    <React.Fragment key={i}>
                        <span className={cls} style={wordStyle}>
                            {parts.map((part, partIdx) => (
                                WAQF_MARKER_CHAR_RE.test(part) ? (
                                    <span
                                        key={`${i}-${partIdx}`}
                                        className="warsh-waqf-marker"
                                        aria-hidden="true"
                                    >
                                        {part}
                                    </span>
                                ) : (
                                    <React.Fragment key={`${i}-${partIdx}`}>{part}</React.Fragment>
                                )
                            ))}
                        </span>
                        {i < words.length - 1 && " "}
                    </React.Fragment>
                );
            })}
        </span>
    );
});

export default WarshWordText;
