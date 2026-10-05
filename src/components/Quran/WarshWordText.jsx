import React, { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { subscribeWarshArchive, getWarshArchiveSnapshot } from '../../utils/warshArchiveRules';
import { getWarshPerWordTajweedRanges } from '../../utils/warshTajwidRanges';
import { CLIP_PAINT_SUPPORTED, paintTajweedWord, clearTajweedWordPaint } from '../../utils/tajweedWordPaint';
import { getWholeWordTajwidRule } from '../../utils/tajwidAnnotation';

/**
 * WarshWordText – renders Unicode Warsh text.
 * Falls back to plain text if no tajweed.
 *
 * Props:
 *  words         - Array of words (strings)
 *  highlightIdx  - Current word index for karaoke highlighting
 *  showTajwid    - Paint the printed Warsh signs with the shared Hafs palette
 */
const WarshWordText = React.memo(function WarshWordText({ words, highlightIdx, showTajwid = false, markerFlags }) {
    const rootRef = useRef(null);
    const archive = useSyncExternalStore(subscribeWarshArchive, getWarshArchiveSnapshot, getWarshArchiveSnapshot);
    const ranges = useMemo(() => showTajwid ? getWarshPerWordTajweedRanges(words || []) : [], [words, showTajwid, archive]);
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || !showTajwid) return undefined;
        const elements = [...root.querySelectorAll('[data-warsh-word]')];
        const repaint = () => elements.forEach(element => {
            const index = Number(element.dataset.warshWord);
            if (element.firstChild?.data !== words[index]) return;
            if (CLIP_PAINT_SUPPORTED) paintTajweedWord(element, ranges[index]);
            else {
                const rule = getWholeWordTajwidRule(words[index], ranges[index]);
                if (rule) element.style.color = `var(--tajwid-${rule})`;
            }
        });
        repaint();
        const observer = new ResizeObserver(repaint);
        observer.observe(root);
        return () => {
            observer.disconnect();
            elements.forEach(element => {
                clearTajweedWordPaint(element);
                element.style.removeProperty('color');
            });
        };
    }, [words, ranges, showTajwid]);
    if (!words || words.length === 0) return null;

    return (
        <span className="warsh-unicode-text inline" dir="rtl" lang="ar" ref={rootRef}>
            {words.map((word, i) => {
                const isMarkerToken = Boolean(markerFlags?.[i]);
                let cls = 'warsh-unicode-word';

                if (highlightIdx !== undefined && highlightIdx !== null) {
                    if (i < highlightIdx) cls += ' wbw-read';
                    else if (i === highlightIdx) cls += ' wbw-current';
                    else cls += ' wbw-upcoming';
                }

                if (isMarkerToken) cls += ' wbw-marker';

                const wordStyle = {
                    fontFamily: 'var(--qd-font-family, var(--font-quran-warsh, var(--font-quran, serif)))',
                };

                return (
                    <React.Fragment key={i}>
                        <span className={`${cls} quran-word-unit`} data-warsh-word={i} data-tajwid={ranges[i]?.[0]?.ruleId} dir="rtl" style={wordStyle}>
                            {word}
                        </span>
                        {i < words.length - 1 && " "}
                    </React.Fragment>
                );
            })}
        </span>
    );
});

export default WarshWordText;
