import React from 'react';
import { getReadableWaqfGlyph } from '../../utils/quranUtils';

const TAJWID_FALLBACK_COLORS = {
    ghunna: '#08a300', idgham: '#8c8c8c', ikhfa: '#08a300', iqlab: '#08a300',
    qalqala: '#0091f0', madd: '#b50000', 'madd-normal': '#ad8500',
    'madd-separated': '#e06c00', 'madd-connected': '#f40000',
    'lam-shamsiyya': '#8c8c8c', tafkhim: '#3f48e6', silent: '#8c8c8c',
    naql: '#e06c00', tashil: '#08a300', ibdal: '#e06c00',
    'madd-badal': '#e06c00', 'sila-kubra': '#f40000', 'tarqiq-ra': '#8c8c8c',
    'idgham-warsh': '#8c8c8c',
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
        <span className="warsh-unicode-text inline" dir="rtl" lang="ar">
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
                        <span className={`${cls} quran-word-unit`} dir="rtl" style={wordStyle}>
                            {parts.map((part, partIdx) => (
                                WAQF_MARKER_CHAR_RE.test(part) ? (
                                    <span
                                        key={`${i}-${partIdx}`}
                                        className="warsh-waqf-marker waqf-marker"
                                        data-waqf={part.codePointAt(0)?.toString(16).toUpperCase()}
                                        aria-hidden="true"
                                    >
                                        {getReadableWaqfGlyph(part)}
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
